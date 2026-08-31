# Overnight work log

**Status as of this writing: all 5 stated priorities have a first pass done and
verified. Tree is committed, builds clean, DB is back to its exact starting row
counts and values.** See "What's left / natural next steps" at the bottom for what
wasn't attempted and why.


Working unattended per standing instructions. Local commits only — no push, no remote,
no deploy, no new installs/servers/ports/network calls beyond what was already used
earlier in this session. Conservative/reversible choices only; logged below as I go.

## Starting state (before this session)

Already built and verified working in the prior turn (browser-tested end to end, then
rolled back to clean DB state):
- Global `blocked_dates` calendar, `delivery_options`, `site_settings` tables (Supabase
  project `wzalpkfivajmlzuqxjyl`), seeded with values matching existing hardcoded copy.
- Fixed admin products price/create bug (`base_price` vs nonexistent `price`/`stock`,
  auto-slug).
- Fixed Supabase REST client missing `Prefer: return=representation` (silently broke
  every insert/update response across the whole app).
- Fixed a timezone off-by-one on booking dates (`toISOString()` vs local date).
- Admin Rentals page (calendar + bookings + delivery options), wired into topnav.
- Wired the previously dead Reserve (booking) and Place Order (checkout) buttons to
  real backend calls.
- None of this was committed yet — it was all sitting as uncommitted working-tree
  changes from the previous turn.

## This session's plan (in priority order per instructions)

1. Get git safe for committing (gitignore), then checkpoint the existing scope.
2. Re-verify existing scope still builds/typechecks/works.
3. Find and fix sibling dead code (other no-op buttons, missing handlers, phantom columns).
4. Harden booking logic (race conditions, timezones, mid-checkout blocked dates).
5. Extend admin customization (more DB-driven content).
6. Write SECURITY_DEBT.md (document only, no action).

Committing in small chunks as each logical piece lands, per the new standing permission.

---

## Log

### [1] Git safety check (before any commit)

Found that the **root `.gitignore` had been deleted** in this working tree (visible in
git status since the very first turn as `D .gitignore`) and never replaced. Only
`frontend/.gitignore` (untracked, Next.js default) existed, which only covers paths
under `frontend/`. This meant `backend/.env` and `backend/pass(ignore dont edit)` had
**zero** ignore coverage — a real risk the moment commits became allowed.

Fixed by restoring the old root `.gitignore` from git history (`git show HEAD:.gitignore`,
which already had `backend/.env` etc. covered from before the migration) and adding:
- `backend/pass(ignore dont edit)` explicitly
- `**/__pycache__/` and `*.pyc` (nested pycache under `backend/api/`, `backend/app/`
  wasn't covered by the old flat `backend/__pycache__/` pattern)
- `/venv/` at root (belt-and-suspenders; `venv/.gitignore` already self-ignores its
  own contents)

Verified with `git check-ignore -v` on all four paths — all confirmed ignored before
touching git further. Will re-check `git status` output before every `git add`.

**Second finding while staging:** `backend/.env.example` and `render.yaml` (both
already sitting as untracked/modified files from before this session) contained
**real, live Supabase credentials** — not placeholders. `backend/.env.example` had
the actual anon key AND the service-role key (which bypasses RLS entirely) for the
live project. `render.yaml` had the real anon key hardcoded in a deploy env var.
Neither of these was `backend/.env` itself (left untouched, as instructed), but
committing either as-is would have put live secrets in git history permanently.

Sanitized both before committing:
- `backend/.env.example` → placeholder values (`your-anon-public-key-here` etc.),
  matching normal `.example` convention.
- `render.yaml` → switched those two env vars to Render's `sync: false` pattern
  (means "set manually in the dashboard, not stored in the repo").

Grepped the whole tree afterward for the JWT prefix and the project ref to confirm
no other file carries a real key. Clean. Also checked `frontend/lib/supabase/client.ts`
(the one place a client-side Supabase key could plausibly live) — it's an unused stub,
no key in it at all (frontend talks to the Flask backend only).

Repo is local-only per the standing rule (never pushed), so the exposure window here
was "sits in local git history" rather than "public," but this class of mistake is
exactly the kind that survives a later `git remote add` if nobody catches it first.

### [2] Checkpoint commits

Committed the pre-existing (uncommitted-until-now) migration from the old Django/Vite
stack to the new Flask/Next.js stack, split into 3 commits for a clean history:
1. `chore: restore root .gitignore for backend secrets`
2. `chore: remove legacy Django backend and Vite admin frontend` (69 files, pure deletions)
3. `feat: Flask backend + Next.js storefront and admin` (115 files - the whole new
   stack plus every fix from the earlier part of this session: price/slug bug,
   Prefer-header bug, timezone bug, rentals/delivery/settings admin, booking+checkout
   wiring)

Left `.claude/settings.local.json` alone (a pre-existing uncommitted permissions-list
change unrelated to the app - not mine to resolve).

Did **not** touch `backend/.env` or `backend/pass(ignore dont edit)` at any point -
confirmed both stayed out of every `git status` listing throughout.

### [3] Sibling dead code (priority 2)

Grepped for the same "commented-out handler, does nothing" pattern that the known
Reserve/Place Order bugs matched. Found two more instances with the exact same shape:

- **Contact page** (`frontend/app/contact/page.tsx`) - `handleSubmit` was fully
  commented out; the Send Message button did nothing. Wired to `messagesAPI`. Also
  swapped its hardcoded email/phone/location/instagram list for `useSiteSettings()`,
  matching the header/footer (filters out any field the admin leaves blank).
- **How It Works page** (`frontend/app/how-it-works/page.tsx`) - same dead pattern on
  its "Have a Question?" quick-contact form. Same fix.

Also found a **phantom-enum bug** in `backend/api/admin_dashboard.py`:
`get_dashboard_stats` summed orders where `status = 'completed'`, but `orders.status`
can only ever be `pending`/`paid`/`fulfilled`/`cancelled` (see the schema CHECK
constraint) - `'completed'` never matches anything, so the Revenue stat was silently
always $0 no matter how many real paid orders existed. Verified this live earlier in
the session (created a real $80 order, dashboard still showed $0 revenue). Fixed to
sum `paid` + `fulfilled` orders instead.

And a **fully-static admin page**: `frontend/app/admin/orders/page.tsx` never fetched
anything - hardcoded "No orders yet" regardless of real data, and the "Export" button
had no handler at all. Added `backend/api/admin_orders.py` (admin-gated GET/PUT,
same pattern as the bookings/rentals admin endpoints) and rebuilt the page: real
order list, per-order status dropdown, and a working CSV export (built client-side
from the already-fetched data, no new backend endpoint needed for that part). Also
wired the Dashboard's "Recent Orders" panel, which had the same hardcoded-static
problem, to show the 5 most recent real orders.

Grepped again afterward for the same dead-handler shape and for other
`eq('status', '<value>')` literals against known CHECK-constrained columns - nothing
else came up. `bookings.status` values used elsewhere all check out against its real
enum (`enquiry`/`confirmed`/`paid`/`completed` - note this is a *different* enum than
`orders.status` and does legitimately include `'completed'`).

### [4] Booking logic hardening (priority 3)

**Race condition**: `create_booking` used to (1) SELECT blocked_dates to see if the
date was free, (2) INSERT the booking, (3) INSERT the blocked_dates row. No atomicity
across those three separate HTTP calls to Supabase's REST API - two concurrent
requests for the same date could both pass step 1 before either reached step 3,
producing two booking rows for one date with only one ever actually blocked (and the
loser's step-3 insert would throw on the UNIQUE constraint, so that request returned
a confusing 500 despite already having created a phantom booking).

Fixed by reordering: claim the date first (INSERT into blocked_dates, no booking_id
yet), and let the UNIQUE constraint on `blocked_dates.date` be the actual concurrency
guard - a losing concurrent request now gets a clean 409 *before* any booking row
exists. If the booking insert then fails for an unrelated reason, the claim is
released (deleted) rather than left stuckas a phantom block. Added `SupabaseError`
(carries the HTTP status code) to `supabase_client.py` so this could be done by
checking `e.status_code == 409` instead of string-matching error text - existing
callers are unaffected since it's still a plain `Exception` subclass.

Applied the same fix to the admin's manual "block a date" endpoint, which had the
identical gap (blocking an already-blocked date would 500 instead of a clean 409).

**Mid-checkout blocking**: if a date gets taken between page load and form submit,
the customer now sees the specific "no longer available" message (already worked)
*and* the frontend refetches blocked dates and clears the now-invalid date selection,
so the calendar reflects reality immediately instead of the customer retrying the
same date and hitting the same error again.

**Timezone**: already fixed earlier in the session (`toISOString()` → local date
components). Reconfirmed this holds through the reordered `create_booking` - the
date string flows through unchanged, no new timezone-sensitive code introduced here.

Not done (didn't come up as a real gap): true DB-level transactions. This raw REST
wrapper has no cross-statement transaction support, so "claim, then create, then
link" is still 3 separate network calls with a failure-cleanup path rather than one
atomic unit. Good enough for a 2-person business's booking volume; would need a
Postgres function (RPC) via Supabase to do properly, which felt like more surface
area than tonight's scope warranted. Noted here rather than attempted.

**Verified live** (restarted the same backend/frontend dev servers used earlier this
session, browser-tested, cleaned up all test data afterward):
- Contact page form → creates a real `messages` row with the right content, confirmed
  in the DB, then deleted.
- How It Works quick-contact form → same, confirmed and deleted.
- Contact page's info block now pulls from `site_settings` live (checked page text
  against the DB values).
- Admin Dashboard stats: **Total Orders 4, Products 8, Revenue $880** (previously
  always $0 - $880 = $280+$450+$150 across the real paid/fulfilled seed orders,
  confirms the phantom-`'completed'` fix). Recent Orders panel shows the 4 real
  orders with correct names/totals/statuses.
- Admin Orders page: lists all 4 real orders (seed data has empty `items: []` arrays,
  so the blank Items column is correct, not a bug); changed one order's status via
  the dropdown, confirmed the write in the DB, reverted it back to `pending`.
- **Race-condition fix**: called `POST /api/admin/blocked-dates` twice in a row for
  the same date - first got `201`, second got a clean `409 "That date is already
  blocked"` (previously would have 500'd). Then called `POST /api/bookings` for that
  same already-blocked date directly - got `409 "That date is no longer available"`
  with **zero** booking rows created (confirmed via `SELECT count(*)` - the old code
  would have let a phantom booking through here). Then ran the normal happy path on
  a fresh date - booking created, `blocked_dates.booking_id` correctly backfilled via
  the follow-up UPDATE, joined the two tables to confirm the link, deleted both.

### [5] Homepage hero content → editable from site_settings (priority 4)

Extended `site_settings` (additive migration - 3 new nullable columns, no existing
column touched) with `hero_eyebrow`, `hero_heading`, `hero_subheading`, defaulted to
the exact copy that was hardcoded in `frontend/app/page.tsx`. Added a "Homepage Hero"
card to `/admin/settings`, wired the homepage to read from `useSiteSettings()` instead
of literal strings.

Verified: homepage renders identically to before with no edits made (confirmed by
reading page text against the original hardcoded strings). Edited the heading via the
admin settings form, confirmed the DB row updated, confirmed the live homepage
reflected the new heading, then reverted it back to the original copy.

This is the pattern to extend if more homepage/about/how-it-works copy should become
admin-editable later - same table, same admin form pattern, same "default equals
current hardcoded copy" approach so nothing visually changes until someone edits it.
Didn't go further than the hero tonight (about page, how-it-works steps, etc. are
still hardcoded) - flagging as a natural next increment rather than doing all of it
at once, since each one needs its own migration + form section + verification pass.

### [Tooling note] A real click-coordinate bug in the browser-automation tool

While testing the settings save button, `computer.left_click` on a ref consistently
failed with "ref is entirely outside the viewport" reporting wildly negative
coordinates (e.g. center (-148, -1378)) - reproducible across page reloads, a fresh
tab, and `resize_window` resets. This looks like a bug in the browser tool's
viewport-relative coordinate calculation for elements far down a tall page, not
anything in the app. Worked around it by dispatching a real `.click()` via
`javascript_exec` (still a genuine DOM click event, still exercises the actual React
onClick handler - confirmed by checking the DB write afterward, not just watching the
UI). Not something to fix in this codebase; noting it in case it recurs.

Related, separate observation: Flask's `debug=True` reloader restarts the process on
every backend `.py` save, which wipes the in-memory `session_store` each time. Twice
tonight this showed up as the admin UI suddenly 401'ing mid-session after a backend
edit. Not a bug - just re-logged-in each time - but worth knowing: **any admin
session dies the moment a backend file changes** during local dev.

One non-issue worth recording: right after restarting the Flask backend mid-session,
the dashboard briefly showed all zeros with 401s in the console. That was the
in-memory `session_store` losing the old token on process restart while the browser
still had the stale token cached in localStorage - not a real bug, just re-logged-in
and it resolved immediately. Mentioning it in case the same thing confuses testing
tomorrow: **an admin session does not survive a backend restart** (sessions are
in-memory only, nothing persisted) - this is pre-existing behavior, not something
introduced tonight, and matches the plaintext-password/dev-mode posture already
signed off on.

### [6] Admin polish pass + final build verification

Grepped for more of the same dead-handler shape across every remaining page (about,
shop, admin login, admin layout) - about and shop pages are static/clean, no forms,
nothing to fix. Found and cleaned up in the admin login page: leftover `console.log`
tracing on every login attempt (including logging a 20-character prefix of the
session token to the browser console - low severity but sloppy) and a dead
commented-out JSX block referencing a `tapeRows` variable that doesn't exist anywhere
in the file (a decorative "ledger tape" panel that was never finished - removed
rather than implemented with fake data, since a fabricated "System status: Balanced"
indicator on a login screen felt more misleading than helpful). Same console.log
cleanup on the dashboard's stats fetch. Kept every legitimate `console.error` on
actual failure paths.

**Final build verification** (hadn't been done yet tonight - typecheck alone doesn't
catch everything a real build does): ran `npm run build` in `frontend/`. Compiled
successfully, all 16 routes generated (14 static, 1 dynamic for `/products/[slug]`,
plus the 404 page), no errors. Confirmed the dev server was still serving correctly
afterward (`/rentals` loaded fine).

**Final DB check**: `list_tables` row counts match the exact baseline from the start
of this session across every table (products 8, bookings 4, orders 4, messages 3,
payments 4, admin_users 1, blocked_dates 0, delivery_options 2, site_settings 1), and
`site_settings` content (including the new hero fields) matches the original seeded
defaults exactly. Every piece of test data created during tonight's verification
passes was deleted or reverted afterward - nothing was left behind, and per the "no
destructive operations" rule, nothing that existed *before* tonight was ever deleted.

## What's left / natural next steps (not attempted, and why)

- **About page / How It Works steps / other long-form copy** are still hardcoded.
  The hero was the highest-visibility, most-requested-feeling piece of homepage copy
  to make editable and got done; going further into full multi-paragraph content
  editing is a bigger CMS-shaped feature that deserves its own pass rather than being
  squeezed in as an afterthought tonight.
- **True DB transactions for booking creation** - noted in section [4]. The current
  "claim, then create, then link, with manual rollback on failure" approach closes
  the actual race condition but is still 3 separate network calls, not one atomic
  unit. A Postgres RPC function via Supabase would be the proper fix.
- **Everything in SECURITY_DEBT.md** - explicitly not acted on per instructions.
  Highest-value item if it's ever picked up: the unauthenticated
  `/api/admin/debug/sessions` endpoint (item 4) - a 5-minute fix (delete the route or
  add the same auth check every other admin route already has) with no design
  tradeoffs, unlike the RLS question which needs real thought.
- **Needs permission / blocked**: nothing hit this tonight. Every task fit inside
  file edits, the already-running local dev servers, the already-connected Supabase
  MCP, and local git - no new installs, ports, servers, or external calls were
  needed for anything on the list.

## Commit log from tonight (oldest first)

1. `chore: restore root .gitignore for backend secrets`
2. `chore: remove legacy Django backend and Vite admin frontend`
3. `feat: Flask backend + Next.js storefront and admin`
4. `fix: wire up remaining dead contact/enquiry forms, fix phantom revenue stat`
5. `feat: real admin Orders page + dashboard recent orders`
6. `fix: close booking race condition, surface conflicts on the calendar`
7. `feat: make homepage hero content editable from admin settings`
8. `docs: security debt inventory (documentation only, no fixes)`
9. `chore: clean up debug console noise and dead code in admin`

All local only - no remote configured, nothing pushed.

