# Security debt

This started as a documentation-only pass - a list of what's insecure, why, and how
bad it is, to be tackled deliberately before this site ever handles real
customers/payments/traffic. Several items have since been explicitly approved and
fixed (marked FIXED below with the reasoning and how it was verified); the rest
remains logged-but-untouched per standing instructions. The project is explicitly in
development and local-only for what remains, which is the main mitigating factor -
none of it has been exploited, and the exposure window so far is "sits on one
laptop," not "sits on the internet."

Ordered roughly by how bad it'd be if this went live as-is today.

## 1. Every Supabase table is writable by anyone with the anon key — FIXED

**Status: fixed** (RLS lockdown round - see `OVERNIGHT_NOTES.md`). Explicitly
approved and requested by Mujtaba, superseding the earlier "don't act on this"
instruction specifically for RLS.

Every table's Row Level Security policy used to be `TO anon, authenticated
USING (true)` / `WITH CHECK (true)` for SELECT, INSERT, UPDATE, and (mostly)
DELETE - including `products`, `orders`, `bookings`, `payments`, `messages`,
`blocked_dates`, `delivery_options`, `site_settings`, `rental_availability`, and
`admin_users`. This existed because the Flask backend itself authenticated to
Supabase with the anon key, so RLS had to stay wide open just for the app to
function - the Flask admin-token check (`verify_admin_token`) was the *only*
real gate, and it was only enforced by the Flask app, not by the database.

**The fix, in two parts:**
1. The backend now authenticates to Supabase with the **service-role key**
   instead of the anon key (`get_supabase_client()` in
   `backend/app/supabase_client.py`). This bypasses RLS entirely, which is
   correct here because Flask already does its own authorization
   (`verify_admin_token` on every admin route) independent of RLS - RLS's job
   shifted from "gate the backend's own operations" to "stop someone from
   bypassing Flask and hitting Supabase's REST API directly with a key they
   found."
2. RLS on every table was then locked down, table by table, each verified live
   and committed separately (see the `frontend/supabase/migrations/2026090102*`
   files): `admin_users`, `bookings`, `orders`, `messages`, `payments`,
   `rental_availability` (confirmed dead), and `payment_settings` (already
   correct from an earlier round) now have **zero** anon/authenticated policies
   at all. `products`, `blocked_dates`, `delivery_options`, and `site_settings`
   are anon-**SELECT-only** - genuinely public data stays readable, nothing can
   be written by anyone without going through Flask's own auth.

Verified directly against the live Supabase project, not just assumed: every
sensitive table now returns `[]` to the anon key on SELECT and a 401 RLS
violation on INSERT; the four public tables still SELECT real data but a real
row's UPDATE/DELETE via the anon key provably changes nothing (checked via the
service-role key before and after, not just a 200/204 status code, which can be
misleading - PostgREST returns success codes even when RLS silently matched
zero rows). Every customer-facing and admin flow was exercised live after each
change: placing a real booking (including the blocked-dates side effect),
placing a real order, and every admin page (products + image upload, rentals
calendar + bookings + delivery options, orders, settings, dashboard).

**Two real, pre-existing bugs surfaced as a side effect** of switching to the
service-role key (both were masked by RLS silently no-op'ing the write, no
error, so nothing ever surfaced them before): `admin_change_password()`'s write
to the `admin_users` table had never actually persisted - only the in-memory
fallback dict was ever really updated, so a changed password would have been
lost on server restart. And the public `DELETE /api/payments/<id>` /
`DELETE /api/messages/<id>` endpoints were silently no-ops (no DELETE policy
existed for the anon key on those tables) - deleting a payment or message
"succeeded" but never removed anything. Both now work correctly.

## 2. `admin_users` is one of those publicly-readable tables — FIXED

Fixed as part of #1 above: the `admin_users` SELECT policy was dropped along
with everything else on that table. Anyone with the anon key used to be able to
read every admin username and the plaintext password (see #3) directly from
Postgres with one unauthenticated REST call - confirmed empirically before this
fix (the live password came back in the response) and after (empty array).

**Note this does NOT affect Mujtaba's own workflow of reading the password
directly from the Supabase dashboard.** The Table Editor and SQL Editor in
Supabase Studio authenticate via his own logged-in Supabase account against
Supabase's management plane - an entirely separate system from the project's
public REST API and its anon/service-role keys. RLS policies only govern access
through that public REST API; they have never applied to, and still don't
apply to, the dashboard itself. This is standard, documented Supabase behavior,
not something this change altered - confirmed by design, not by testing (there
was no way to test his actual dashboard session from this environment).

## 3. Admin passwords are stored and compared in plaintext

`admin_users.password` is plain text, and `admin_login()` does a direct string
compare (`db_user['password'] == password`), no hashing. The seed migration
(`supabase/migrations/001_create_admin_users.sql`) also hardcodes the actual default
credentials (`admin` / `changeme123`) directly in a SQL file.

**This is deliberate, not an oversight** - explicitly requested: the site is in early
development, one person manages it, and the ability to open Supabase and copy the
password straight out of a table (instead of it being an unrecoverable bcrypt hash)
was a stated requirement, not a mistake to be corrected. Documenting it here per
instruction, **not changing it**.

One nuance worth flagging for whoever revisits this: the seed migration file itself
is part of this git repo's history now (it was committed tonight as part of the
overall stack migration, since the repo was uncommitted before this session and had
to be checkpointed as-is). Right now that's low-stakes because this repo has never
been pushed anywhere and is explicitly local-only. But git history is forever - if
this repo is ever pushed to GitHub/GitLab/shared with anyone, that seed file will
hand out the literal admin password (or whatever it's since been changed to, if the
migration is ever rerun) to anyone who can read the repo, permanently, even if the
live DB password is changed later. Worth rotating the password (in the DB, not by
editing the old migration) before ever making this repo non-local, since by then it's
not really a "development password" anymore.

## 4. Unauthenticated debug endpoint leaks live session tokens — FIXED

**Status: fixed** (payments round - see `OVERNIGHT_NOTES.md`). Explicitly approved
for this round: adding payment config right next to an unauthenticated token leak was
judged unacceptable, so this was done first, ahead of everything else in that round.

`GET /api/admin/debug/sessions` (`backend/api/admin_views.py:debug_sessions`) used to
have **no authentication check at all** and returned the count of active admin
sessions, the first 5 actual session tokens (not hashed - the literal bearer tokens,
usable to impersonate whoever holds those sessions), and the list of admin usernames.
It's worse than #2 in one specific way: it didn't even require the Supabase anon key,
just network access to the Flask backend.

Now requires a valid admin bearer token (same `verify_admin_token` check every other
admin endpoint uses) and only returns the session count - no tokens, no usernames,
even to an authenticated caller, since there's no legitimate reason to hand a session
token out a second time after it was already issued at login. Covered by
`backend/tests/test_admin_auth.py::DebugSessionsTests`.

## 5. No rate limiting on login

`POST /api/admin/login/` has no throttling, lockout, or delay. Combined with a short
plaintext password (`changeme123`), it's brute-forceable if ever exposed to the
internet. Same caveat as everything else - not exposed right now.

## 6. No CSRF protection

Admin state-changing endpoints rely solely on the bearer token in an `Authorization`
header (not a cookie), which incidentally provides *some* CSRF resistance already
(a cross-site form can't set a custom Authorization header), but there's no explicit
CSRF token scheme. Lower priority given the token-in-header pattern already blocks
the classic CSRF vector.

## 7. Real credentials were sitting in "safe to commit" files (found and fixed tonight)

`backend/.env.example` and `render.yaml` both contained **real, live Supabase
credentials** - including the service-role key (which bypasses RLS entirely) in
`.env.example` - instead of placeholders, despite being the kind of file that's
normally committed as a template. These were sanitized before the first commit
tonight (see `OVERNIGHT_NOTES.md` entry [1] for the full story) - placeholders now,
real values only in the untracked `backend/.env`. Mentioning it here because it's
exactly the kind of mistake that's easy to reintroduce: if `backend/.env` is ever
copied into a new `.env.example` "for reference," check it's actually been
sanitized before it's staged.

## 8. Legacy public bookings/orders/messages/payments routes had no auth at all — FIXED

Found while planning the Stripe receipt work (`Round six`, see `OVERNIGHT_NOTES.md`),
not previously documented here. `GET`/`PUT`/`DELETE` on `/api/bookings`,
`/api/orders`, `/api/messages`, and `/api/payments` (list and by-id) had **no
authentication check at all** - only their `POST` (customer-facing create) was ever
meant to be public. This is a Flask-application-layer gap, separate from and
independent of item #1's RLS issue: RLS only closes the "bypass Flask and hit
Supabase's REST API directly" path, but this hole was reachable by hitting Flask
exactly as intended - no anon key needed, no bypass required.

**What this meant concretely:** anyone who could reach the backend could run
`curl http://backend/api/orders` and get every customer's name, contact info, and
order contents back, unauthenticated. The same for bookings, contact-form messages,
and payment records. `PUT`/`DELETE` on the same routes meant anyone could also edit
or delete any of those records by id, again with no token.

**Status: fixed.** Confirmed via grep first that the frontend never calls anything
but `POST` on these four routes - `.list()`/`.get()`/`.update()`/`.delete()` in
`frontend/lib/api-client.ts` for `bookingsAPI`/`ordersAPI`/`messagesAPI`/`paymentsAPI`
are defined but never called from any page or component - so gating the rest behind
the existing admin-token check had zero functional risk to the live site. Verified
live: all four create flows still work with no auth; every other method now
correctly returns 401 without a valid admin token and succeeds with one, with no
data actually read, modified, or deleted by the unauthenticated attempts tested
against the real backend.

## 9. Admin sessions lived in an in-process dict, breaking under multiple workers — FIXED

Found in production, not in code review: the deployed Render backend runs gunicorn
with 4 worker processes (`render.yaml`'s `-w 4`), but `backend/api/session_store.py`
stored every session in a plain module-level `ADMIN_SESSIONS = {}` dict - private to
whichever single worker process happened to handle a given request. Login would land
on one worker and write the token into that worker's memory; the very next request
could route to a different worker that had never seen it, 401ing immediately.
Reproduced exactly by Mujtaba's production logs (login 200, then every subsequent
admin request 401 within the same second) and confirmed by reading the code and
`render.yaml` together before touching anything, per instruction not to fix a theory
that hadn't been confirmed.

**Status: fixed.** Sessions now live in a new `admin_sessions` Supabase table instead
of process memory - shared by every worker, and durable across restarts, deploys, and
cold starts, none of which the alternative considered (pinning to a single gunicorn
worker) would have actually solved, since Render recycles processes for reasons
having nothing to do with worker count. RLS locked down identically to
`payment_settings`: enabled, no anon/authenticated policy at all, verified with the
anon key afterward (`SELECT` returns `[]`, `INSERT` gets a 401 RLS violation) rather
than assumed. Session lifetime kept at 24 hours, matching the original in-memory
design. Verified with two genuinely separate, unrelated Python processes against the
real Supabase project (not just gunicorn workers, which at least fork from a common
parent) - a token created by one process verified as valid from a second process that
never shared any memory with it, which is the exact failure mode this fixes. A
regression test (`CrossProcessSessionTests` in `backend/tests/test_session_store.py`)
locks this in, and was confirmed to actually fail against the old implementation
before being trusted.

**The lower-severity sibling, left alone for now:** `ADMIN_USERS` in
`backend/api/admin_views.py` is the same shape of bug - an in-memory dict, mutated by
`admin_change_password()`, that any given gunicorn worker might have a stale copy of.
Not fixed in the same pass because the practical impact is much smaller:
`admin_login()` and `admin_change_password()` both check the real `admin_users`
Supabase table *first* and only fall back to this dict if that lookup fails, and
(since the RLS-lockdown round's service-role-key switch) that Supabase write now
genuinely persists. So a stale in-memory copy on some workers only matters in the
edge case where Supabase is transiently unreachable at the exact moment of a login or
password-change request - a real gap, but a narrow one, unlike sessions where the bug
fired on essentially every request. Worth the same fix eventually (most likely:
delete the fallback entirely now that Supabase reliably persists the password, rather
than building it a session-table-style replacement) - tracked here for a separate
pass rather than bundled into this one.

## What's *not* debt (deliberate, already-accepted tradeoffs)

- Plaintext admin password (item 3) - explicit requirement, revisit only if/when the
  site handles real customer payment data or goes multi-admin. Confirmed unaffected
  by the RLS lockdown (item 1/2) - reading it from the Supabase dashboard uses
  Mujtaba's own account session, not the anon/service-role keys RLS governs.
- No real payment processor integrated - was explicitly out of scope in earlier
  rounds. A Stripe integration was added in the payments round (raw REST calls, no
  SDK), but it has never been tested against a real Stripe account (no credentials
  exist) and stays fully inert until real `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`
  values are added to `backend/.env` - see `backend/README.md`.

## Note: payment_settings was the working model for the item #1/#2 fix

`payment_settings` (added in the payments round: bank account number, Stripe's
non-secret config) was the first table in this project locked down to zero anon
access via the service-role key, before the rest of the RLS lockdown existed as a
plan. When item #1/#2 were tackled properly in the RLS lockdown round, this table's
existing pattern (service-role key + RLS with no anon/authenticated policy) is
exactly what got extended to every other sensitive table in the project - it wasn't
a one-off exception anymore by the time that round finished, it was the template.
