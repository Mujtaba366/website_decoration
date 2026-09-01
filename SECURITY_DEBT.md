# Security debt

This is a documentation-only pass. Nothing here has been changed or fixed - it's a
list of what's insecure right now, why, and roughly how bad it is, so it can be
tackled deliberately before this site ever handles real customers/payments/traffic.
The project is explicitly in development and local-only at the moment, which is the
main mitigating factor for all of this - none of it has been exploited, and the
exposure window so far is "sits on one laptop," not "sits on the internet."

Ordered roughly by how bad it'd be if this went live as-is today.

## 1. Every Supabase table is writable by anyone with the anon key

Every table's Row Level Security policy is `TO anon, authenticated USING (true)` /
`WITH CHECK (true)` for SELECT, INSERT, UPDATE, and (mostly) DELETE. That includes
`products`, `orders`, `bookings`, `payments`, `messages`, `blocked_dates`,
`delivery_options`, `site_settings`, and `admin_users`.

**What this means concretely:** the Flask backend's admin-token auth
(`verify_admin_token`, the `Authorization: Bearer <token>` check on `/api/admin/*`
routes) is the *only* thing standing between a visitor and the database - but it's
only enforced by the Flask app. Anyone who has the Supabase anon key can skip Flask
entirely and hit `https://<project>.supabase.co/rest/v1/<table>` directly with that
key, and Postgres will let them read, insert, update, or delete anything in any
table. No admin token needed at that layer at all.

**Why this exists:** this looks like a deliberate simplification for a
fast-moving 2-person business site (the original schema migration's own comment says
"this is a public storefront with no sign-in... intentionally public/shared"), which
is fine for the genuinely public tables (`products` SELECT, customers creating their
own `bookings`/`orders`/`messages`). It's not fine for `admin_users`, `payments`
status, or letting anyone overwrite `site_settings` or delete any booking/order they
want.

**Not fixed because:** tightening RLS is exactly the kind of "act on the auth model"
change that's explicitly out of scope for now (both the general "don't act on
security debt" instruction and the specific "don't add RLS beyond the existing
project pattern" one). Also because the backend authenticates to Supabase with the
**anon key**, not a service-role key (see `backend/app/supabase_client.py` -
`get_supabase_client()` reads `SUPABASE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in
`.env` is currently unused) - so tightening RLS to "authenticated only" would break
the backend too, since the backend never authenticates as a real Supabase user.
Properly fixing this later means either (a) moving all admin writes to using the
service-role key server-side and locking RLS down to owner-only for everything else,
or (b) implementing real Supabase Auth for admins and keying RLS off `auth.uid()`.
Either is a real project, not a quick patch.

## 2. `admin_users` is one of those publicly-readable tables

Specifically because of #1: `admin_users` has `SELECT` open to `anon`. Combined with
the plaintext password column (see #3), anyone with the anon key can read every admin
username and password directly from Postgres, with a single unauthenticated REST call
- no login attempt, no rate limit, no Flask involvement at all.

**Mitigating factor right now:** the anon key isn't currently shipped anywhere a
visitor could see it. `frontend/lib/supabase/client.ts` (the one place a client-side
Supabase key would plausibly live) is an intentional stub - the frontend talks to the
Flask backend only, never to Supabase directly. The anon key only exists in
`backend/.env` (never committed - confirmed) and in Supabase's own dashboard. It's
also not hardcoded in the deployed backend, though see #7 below for how close that
came to changing tonight.

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

## What's *not* debt (deliberate, already-accepted tradeoffs)

- Plaintext admin password (item 3) - explicit requirement, revisit only if/when the
  site handles real customer payment data or goes multi-admin.
- Fully open RLS on customer-facing tables (products read, bookings/orders/messages
  insert) - reasonable for a public storefront with no customer accounts. The problem
  is specifically the tables that *shouldn't* be open (`admin_users`, arguably
  `site_settings` writes and order/payment status), not the pattern itself everywhere.
- No real payment processor integrated - was explicitly out of scope in earlier
  rounds. A Stripe integration was added in the payments round (raw REST calls, no
  SDK), but it has never been tested against a real Stripe account (no credentials
  exist) and stays fully inert until real `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`
  values are added to `backend/.env` - see `backend/README.md`.

## Note: the payment_settings table is a deliberate exception to item #1

Added in the payments round: `payment_settings` (bank account number, Stripe's
non-secret config) has RLS enabled with **no** anon/authenticated policy at all -
verified directly against the live Supabase project that the anon key gets an empty
result from it. Only backend code using the service-role key
(`get_supabase_admin_client()`) can touch it. This is the one table in the project
that does NOT follow the "everything open" pattern described in item #1, done
narrowly for this one sensitive table rather than as a general RLS fix. If item #1 is
ever tackled properly, this table is a working example of the target pattern
(service-role key + locked-down RLS) already in production use.
