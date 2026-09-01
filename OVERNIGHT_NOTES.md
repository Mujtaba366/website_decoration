# Overnight work log

## Start here

This file is a chronological log of unattended work sessions on this repo, most
recent first. It grew organically across several sessions rather than being
written as one document, so here's the map:

- **This "Start here" section** - what's below, and the current prioritized
  recommendations (read this first).
- **"Round seven"** - deploy-prep round: full git-history secret scan before
  the first-ever push, found the GitHub repo is public (paused for a decision
  rather than pushing), and reconciled `render.yaml` with the service-role
  key migration. Surfacing Stripe payment/receipt data in the admin panel
  (the second half of round six's ask) is still outstanding - paused when
  this deploy request came in, not forgotten.
- **"Round six"** - the RLS lockdown round: switched the backend to the
  service-role key and locked Row Level Security down on every table
  (`SECURITY_DEBT.md` items 1 and 2, explicitly approved this round,
  superseding the earlier "don't touch RLS" instruction). Also found and
  fixed a second, separate auth gap (legacy public bookings/orders/messages/
  payments endpoints with no auth check at all).
- **"Round five"** - the payments round: fixed the unauthenticated debug
  endpoint (approved to act on `SECURITY_DEBT.md` item 4 for the first time),
  added cancel/delete for bookings and orders, product image upload to
  Supabase Storage, a thorough sweep making the rest of the site's
  business-specific copy DB-editable, and bank transfer + Stripe payment
  settings built on a new public/admin-only data split.
- **"Side request, mid-round-three"** - a one-off task (deleted
  `backend/.env.example`), not part of the numbered round work.
- **"Round four"** - the closing round: finished the `service_area_note` bug
  class sweep with regression tests, confirmed the admin mobile fix from round
  three still holds, added frontend test coverage for the booking/calendar
  logic, and a handover (this file + the root `README.md`).
- **"Round three"** - found and fixed two real bugs by re-testing round two's
  own claimed fixes empirically (a stale-password-check bug, and every admin
  endpoint downgrading clean 400s into 500s), fixed a real mobile usability
  problem, fixed a dead settings field, added a third page-hero to the
  DB-editable content pattern.
- **"Round two"** and **"Round one"** - the earlier work: migrated the whole
  stack from Django/Vite to Flask/Next.js, built the rental global-calendar
  feature end to end (the original ask), added the first automated tests (from
  zero), hardened the Flask backend, and made the homepage/About page content
  DB-editable for the first time.

**Current state**: tree builds clean (`npm run build` in `frontend/`), both test
suites pass (109 backend tests via `unittest`, 16 frontend tests via
`node --test`, zero new dependencies for either), and the Supabase database is
at the same row counts it started this engagement at, plus one new table
(`payment_settings`, singleton row) and 13 new nullable/defaulted columns on
`site_settings` from round five - every piece of test data created during any
verification pass across every round (including round five and six's live
end-to-end checks against the real Supabase project and a real admin login)
was deleted or reverted immediately after confirming it worked. As of round
six, the backend authenticates to Supabase with the service-role key and every
table's RLS is locked down (zero anon access on sensitive tables, anon-SELECT-
only on public ones) - verified directly against the live project, not just
assumed. Nothing is mid-edit. Everything is committed locally; nothing has
been pushed anywhere yet - the no-push rule was lifted for this repo
specifically in round seven, but the push itself is paused pending Mujtaba's
decision on the GitHub repo's public visibility (see "Round seven" below).

## Recommended next steps, prioritized

Weighted toward what actually helps a 2-person business running this
themselves, not toward what would look complete in a portfolio. Where I think
something would be over-engineering for what this site actually needs, I've
said so rather than padding the list.

**Do soon - small effort, no real downside:**
1. **Paste in real Stripe credentials once a Stripe account exists.**
   `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `backend/.env` (see that
   file's README for exactly what goes where and how to get them), then turn
   on "Offer card payment at checkout" and paste the publishable key in
   Admin → Settings → Payment Settings. Until then card payment correctly
   stays unavailable rather than erroring - this has been verified, not just
   assumed (see round five below). This is the one remaining piece of the
   payments work that a developer, not this engagement, has to finish.
2. **Rate-limit the admin login endpoint** before this is ever reachable from
   the open internet (it currently isn't - local only). Small effort, clear
   value the moment this gets a real deployment.
3. **Verify the Auckland postcode range** (`frontend/lib/date-utils.ts`,
   flagged repeatedly and never fixed - needs an authoritative NZ
   postcode-to-region source I couldn't reach under this engagement's
   no-external-network-calls rule). This affects real delivery-fee logic, so
   it's worth someone with access to real postcode data checking before it
   ever matters for an actual out-of-area booking.

**Real projects - only worth it once the business genuinely needs them:**
4. **A webhook secret and a live Stripe account, once real transaction volume
   justifies automating reconciliation.** Right now, even once Stripe is
   configured, marking an order paid still depends on the webhook actually
   firing and the secret being set - it's real but minimal, not a full
   payments ops setup (no refund handling, no partial payments, no retry UI).
   Worth revisiting once payment volume makes manual reconciliation painful.
5. **Real Supabase Auth for admins**, if this ever goes multi-admin. Not
   needed now - RLS is locked down (round six) independent of whether admin
   auth is custom-token-based or real Supabase Auth, so this is purely about
   supporting more than one admin user cleanly, not a security gap.

**Probably not worth doing at all, for a site this size:**
6. **Making every remaining piece of generic marketing copy DB-editable**
   (the homepage feature-highlight cards, the how-it-works step cards, the
   about-page "values" grid). Round five deliberately drew the line at page
   heroes/intros and business facts (contact info, hours, bank details) and
   left generic design copy alone - editing a `.tsx` file directly for
   marketing copy that changes rarely is genuinely fine, and an admin settings
   page with fields for every card on every page would become unusable.
7. **True Postgres-transaction atomicity for booking creation** (noted
   repeatedly as deferred - the current "claim the date, then create the
   booking, roll back on failure" approach closes the actual race condition
   but isn't one atomic database transaction). This would only matter at a
   booking volume this business is unlikely to reach - two customers
   racing to book the exact literal same millisecond is not a real risk here.
8. **CI, admin roles/permissions, multi-admin support.** No remote, no
   collaborators, one admin user. Building any of this now would be solving
   problems that don't exist yet.
9. **Backfilling the payments-round migrations into
   `frontend/supabase/migrations/`** (noted in round six - those schema
   changes were only ever applied live via the Supabase MCP tool, never
   mirrored into the repo the way every other migration is). Low priority:
   Supabase's own migration history already has the authoritative record: use
   `mcp__supabase__list_migrations` (or the dashboard's Migrations view) if
   this is ever needed, rather than treating it as urgent.

---

## Round six (RLS lockdown + Stripe receipts)

Two explicit asks this round, in order: lock down RLS across every table
(`SECURITY_DEBT.md` items 1-2), then surface Stripe payment/receipt data in
admin. Mujtaba explicitly approved acting on RLS this time - it had been
documented-but-untouched all engagement until now, and this explicitly
supersedes that "don't touch it" instruction, for RLS specifically only.
Called out as the riskiest change of the engagement, with instructions to plan
before touching anything, go table by table, verify live after each change
(not just assert), and commit per table so any single step could be rolled
back cleanly.

### Part 1: RLS lockdown

**The plan, decided before any change was made:** every table's RLS was wide
open (`anon, authenticated USING (true)`) for one root-cause reason - the Flask
backend itself authenticated to Supabase with the anon key, so RLS had to stay
open just for the app to function; the *actual* access control was Flask's own
`verify_admin_token` check, enforced only at the app layer. The fix mirrors what
the payments round already did for `payment_settings`: switch the backend to
the service-role key (bypasses RLS, and Flask already does its own
authorization independent of RLS), then lock RLS down purely as a defense-in-
depth boundary against someone bypassing Flask entirely and hitting Supabase's
REST API directly with a leaked or found key. Confirmed first that the
frontend never talks to Supabase directly (`frontend/lib/supabase/client.ts`
is a genuine unimported stub) - this whole plan depends on that being true.

**Step 1 - the foundational change:** `get_supabase_client()` in
`backend/app/supabase_client.py` now reads `SUPABASE_SERVICE_ROLE_KEY` instead
of `SUPABASE_KEY`. Deliberately done and verified *before* touching any RLS
policy, since with RLS still wide open at that point this is a pure permission
superset - if something broke here, it would have been an immediate, obvious
signal to stop, with zero interaction with the RLS changes still to come.
Verified live against the real Supabase project: public reads, admin login,
admin reads/writes, and payment settings all still worked exactly as before.

**Two real, previously-invisible bugs surfaced immediately** as a side effect,
both worth knowing about: `admin_users` had no UPDATE policy for the anon key,
so `admin_change_password()`'s write to Supabase had been silently failing
this entire engagement (0 rows matched, no error - PostgREST doesn't error on
a no-op update) - a changed password only ever persisted to the in-memory
fallback dict, meaning it would have been lost on any server restart. Verified
directly: changed the password, confirmed via SQL it now actually updates the
Supabase row (where it silently didn't before), then reverted immediately.
Similarly, `payments` and `messages` had no DELETE policy for anon, so the
public `DELETE /api/payments/<id>` and `/api/messages/<id>` endpoints had been
silent no-ops - "deleted successfully" without deleting anything. Both are now
genuinely fixed as a consequence of the key switch, not separately patched.

**Steps 2-11 - table by table**, each its own Supabase migration (mirrored as a
git-tracked file in `frontend/supabase/migrations/` - see the note below about
why that matters), its own commit, and live verification before moving on:

- **Zero anon/authenticated access at all** (nothing legitimate ever needs it,
  now that Flask uses the service-role key): `admin_users`, `payments`,
  `messages`, `orders`, `bookings`, `rental_availability`. The last one was
  confirmed dead first - defined in `backend/app/view.py` and exposed at
  `/api/availability`, but grep-confirmed that `availabilityAPI` in
  `frontend/lib/api-client.ts` is never called from any page or component;
  superseded by the global `blocked_dates` calendar. `payment_settings`
  already had zero anon access from the payments round - unchanged.
- **Anon SELECT-only** (genuinely public data, but no writes): `products`,
  `blocked_dates`, `delivery_options`, `site_settings`.

**Verification wasn't just "check the status code."** PostgREST returns a
misleadingly successful-looking 200/204 for an UPDATE/DELETE that RLS silently
filtered down to zero matched rows - the same shape of response as a genuinely
successful operation. So for the SELECT-only tables specifically, verification
picked a REAL existing row, attempted to change/delete it with the anon key,
then checked via the service-role key whether the value had *actually* changed
- confirmed unchanged/still-present in every case, not just "got a 200 back."
For the zero-access tables, confirmed SELECT returns `[]` and INSERT returns an
explicit 401 RLS-violation error from PostgREST.

**Every real flow was exercised live**, not just curl'd against the API in
isolation: placed a real rental booking through the storefront (confirmed the
`blocked_dates` claim-then-create side effect fired correctly), placed a real
shop order through cart checkout, and worked through every admin page -
dashboard stats, products list/create/delete/image-upload, the rentals page
(global calendar block/unblock, bookings list, delivery options), the orders
page, and the settings page (general fields + the payment settings section).
All test data (bookings, orders, payments, blocked dates, a product, a
delivery option, a stray leftover blocked-date row found during cleanup from
earlier in this same session) was deleted or reverted immediately after each
check - the database is back at the exact same baseline row counts as every
previous round's handover.

**Final consolidated check**, run once at the end across all 11 tables with the
anon key directly against Supabase's REST API (bypassing Flask entirely - the
exact attack path this whole round closes): `admin_users`, `bookings`,
`orders`, `messages`, `payments`, `rental_availability`, and `payment_settings`
all return `[]`. `products`, `blocked_dates`, `delivery_options`, and
`site_settings` still return real public data to SELECT, and a real row's
UPDATE/DELETE via anon changes nothing (re-verified, not just asserted).

**The one compatibility question explicitly flagged - confirmed unaffected:**
Mujtaba reading the plaintext admin password directly from the Supabase
dashboard. This still works exactly as before, and always will regardless of
RLS: the Table Editor and SQL Editor in Supabase Studio authenticate via his
own logged-in Supabase account against Supabase's management plane - a
completely separate system from the project's public REST API and the
anon/service-role keys RLS actually governs. This isn't something the lockdown
could have broken even in principle; noting it here as a confirmed fact about
how Supabase works, not as something empirically tested (there's no way to
test his actual dashboard session from this environment).

**A gap fixed along the way, not originally in scope for this round:** every
Supabase schema change made in the previous (payments) round - the
`payment_settings` table, the product-images Storage bucket, the `bookings`
'cancelled' status, and the 13 new `site_settings` content columns - had only
ever been applied live via the Supabase MCP tool, never mirrored into
`frontend/supabase/migrations/` the way the project's own established
convention expects. This meant the actual schema history wasn't fully
git-tracked. Fixed going forward: every RLS migration this round has a
matching file in that directory, so the "commit per table, rollback cleanly"
instruction is backed by real git history, not just Supabase's own internal
migration log. The older gap (payments-round migrations never backfilled into
the repo) was deliberately left alone rather than retroactively fixed, to
avoid scope creep on an already large, high-risk task - Supabase's own
`list_migrations` history remains the authoritative record for those if ever
needed.

Backend test suite unaffected by any of this (the suite mocks Supabase
entirely, so it never exercised the real RLS policies either before or
after - a real gap in what the suite can catch, worth knowing about rather
than treating "tests pass" as proof RLS was ever configured correctly. Every
RLS claim in this round was checked directly against the live database).

**A second, separate finding surfaced while planning Part 2 below**, and was
fixed on the spot with Mujtaba's approval: `/api/bookings`, `/api/orders`,
`/api/messages`, and `/api/payments` had no auth check at all on
GET/PUT/DELETE - only POST (customer-facing create) was ever meant to be
public. This is a Flask-layer gap, independent of RLS (RLS only closes the
"bypass Flask, hit Supabase directly" path - this was wide open even going
through Flask exactly as intended). Confirmed via grep the frontend never
calls anything but POST on these four routes, so gating the rest had zero
functional risk. Now documented as `SECURITY_DEBT.md` item 8 (fixed). Test
suite grew to 109 tests covering this plus everything else in the round.

### Part 2: Stripe payment/receipt data in admin

**Not started.** Paused immediately after finding and fixing the endpoint-auth
gap above, when Mujtaba's deploy request (see "Round seven") came in. Still
outstanding: order/booking rows showing payment status, amount paid, a
receipt link, and a refund action, sourced from Stripe's Charge/PaymentIntent
data, degrading cleanly when Stripe is unconfigured (still no real
credentials). Pick this up next.

---

## Round seven (deploy prep)

Mujtaba asked to push this repo to GitHub (`Mujtaba366/website_decoration`,
already connected to Render for auto-deploy) and get it deployment-ready, but
with explicit, non-negotiable gates before any push: a full git-history
secret scan (not just the working tree), a check on whether the GitHub repo
is public or private (stop and ask if public), and confirmation `.gitignore`
still covers `backend/.env`.

**Git history scan - clean.** Checked all 69 commits, not just current
files: no `.env` file was ever committed at any point; `backend/.env.example`
and `render.yaml` (the two files that briefly held real credentials before
the very first commit, per the side-request entry earlier in this log)
contain only placeholder values at every commit that ever touched them;
a full-history grep for the Supabase JWT header pattern, Stripe secret-key
patterns (`sk_test_`/`sk_live_`/`whsec_`), and every historical
`SUPABASE_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_URL` assignment turned up
nothing but placeholders, `${VAR}` substitutions, and `os.getenv(...)` reads -
never a live value. `backend/.env` is properly gitignored and was never
tracked. One untracked, gitignored local file (`backend/pass(ignore dont
edit)`) exists on disk but has never been committed - left untouched, not
this engagement's business.

**GitHub repo visibility - PUBLIC. Push paused, not completed.** Per the
explicit instruction to stop and ask rather than push a public repo
unprompted, no `git remote add` or `git push` has been run. Everything below
is prepared and ready to go the moment Mujtaba decides how he wants to
proceed (make it private first, or push knowingly as public).

**`render.yaml` reconciled** with the service-role-key migration from round
six - it only referenced the anon key, which is no longer read by any backend
code at all; `SUPABASE_SERVICE_ROLE_KEY` was missing entirely, which would
have made every database-touching request fail on a real deploy.  Added it,
plus `SECRET_KEY` and the two optional Stripe vars, all `sync: false` (set in
Render's dashboard, never committed). Also found and fixed a subtler risk:
`CORS_ORIGINS` and `NEXT_PUBLIC_API_URL` had hardcoded, mismatched guessed
`onrender.com` URLs instead of `sync: false` - since a blueprint sync applies
non-`sync:false` values on deploy, pushing this file as it stood risked
silently overwriting whatever correct values might already be set in Render's
dashboard with these wrong guesses. Changed both to `sync: false` so they
must be set explicitly and can't be clobbered this way.

**First-deploy risks flagged for Mujtaba** (full detail given directly to
him, not duplicating it all here): `NEXT_PUBLIC_API_URL` is a Next.js
build-time-baked variable, not a runtime one - if it's wrong when
`npm run build` runs on Render, the entire deployed site (public and admin)
silently falls back to calling `localhost:5000` and nothing works, with no
obvious error. `frontend/app/layout.tsx`'s `metadataBase` is still hardcoded
to a guessed, likely-wrong `onrender.com` URL (SEO/social-preview metadata
only, not functionality) - needs a manual update once the real deployed URL
or a custom domain is known, left alone here rather than guessing again.
Confirmed unaffected by anything in this round: `gunicorn` is already in
`requirements.txt`; the `product-images` Storage bucket is public and its
uploads go through the service-role key, so it works regardless of anon RLS;
and the `admin_users` row already exists in the same Supabase project this
app has used all engagement, which is what would go live - no separate
prod database to seed.

---

## Round five (payments round)

Trigger: Mujtaba's instruction that "the eventual owner should be able to change
anything business-specific themselves, without a developer" - a larger round
covering admin delete/cancel actions, product image upload, a full content sweep,
and bank transfer + Stripe payment settings. Standing rules unchanged (local
commits only, no push/deploy, additive DB changes only, no new installs, don't act
on the rest of `SECURITY_DEBT.md`). One explicit new authorization: fix the
unauthenticated `debug/sessions` endpoint first, since leaking admin session
tokens right next to new payment config was judged unacceptable to leave any
longer.

**1. Fixed `GET /api/admin/debug/sessions`** (`SECURITY_DEBT.md` item 4, the one
item on that list explicitly approved to act on this round). It had no auth check
at all and returned live session tokens and admin usernames to anyone who could
reach the backend. Now requires a valid admin token and returns only a session
count - no tokens or usernames even to an authenticated caller. Regression tests
in `test_admin_auth.py::DebugSessionsTests`.

**2. Cancel/delete for bookings and orders in the admin UI.** The backend already
had public, unauthenticated `DELETE` endpoints for both - the actual gap was no
admin-gated version and no UI. Added `'cancelled'` to `bookings.status`'s CHECK
constraint (additive - existing rows untouched; `orders.status` already allowed
it). Cancelling a booking or deleting it both release its `blocked_dates` row, so
the date opens back up on the global calendar - this was the one behavior that
had to be new logic, not just UI wiring, since the existing generic
`update_admin_booking` PUT never touched the calendar. New admin-gated
`DELETE /api/admin/bookings/<id>` and `DELETE /api/admin/orders/<id>`, so the
admin UI no longer needs to fall back to the unauthenticated public routes.
Cancel (soft, keeps the record) is the primary action in the UI; Delete (hard,
with a stronger confirm) is offered alongside it for removing test/duplicate
entries entirely - both destructive actions confirm before running.

**3. Product image upload to Supabase Storage.** Created a public
`product-images` bucket (5MB limit, image MIME types only, enforced at both the
bucket level and in the new upload endpoint) via a migration - Storage buckets
are just rows in `storage.buckets`/`storage.objects`, so this needed no new
tooling. New `SupabaseClient.upload_file()` method uploads via a raw REST call to
Supabase's Storage API (no `supabase-py`/`storage3` dependency, matching the rest
of this hand-rolled client). Admin products page now uploads a real file - both
the "Add Product" form and, importantly, the inline edit row, which previously
had no way to change a product's image at all despite `editData.image` existing
in state (an editable-but-disconnected gap of the same shape as the
`service_area_note` bug from round three, just never hit because no UI exposed
it). Verified end-to-end against the real Supabase project: uploaded a real file
through the live endpoint, confirmed the returned public URL actually served the
image back, then cleaned up the test object.

**4. Content sweep** - the highest-value item per the request, done thoroughly. An
Explore-agent pass across every page found: the Contact page's hero and intro
text were hardcoded, business hours didn't exist anywhere on the site at all, the
homepage CTA banner and the Rentals/Shop page hero blocks were hardcoded, and the
footer's bottom line ("Made with care in Auckland, Aotearoa") was hardcoded
separately from the already-editable `tagline` field. Added 13 new
nullable/defaulted `site_settings` columns (backfilled on the existing row to
match the current hardcoded text exactly, so nothing changed visually until an
admin edits something) and wired all of it through - contact page, homepage CTA,
rentals/shop hero blocks, footer note, and a genuinely new `business_hours` field
(shown in the footer and on Contact, hidden entirely rather than showing a
made-up default when left blank). Every new field was added to both the frontend
form and the backend `SETTINGS_FIELDS` whitelist together, with
`test_admin_settings.py`'s `FRONTEND_FORM_FIELDS` list extended to match - the
exact discipline round three's `service_area_note` postmortem called for, so this
round doesn't reproduce that bug class with 13 new fields.

Also fixed, found in the same sweep: the site's social-share preview image
(`openGraph`/`twitter` metadata in `frontend/app/layout.tsx`) pointed at a
`bolt.new` placeholder image left over from scaffolding, not anything belonging
to this business. Replaced with the same hero photo already used on the
homepage.

**Deliberately NOT made editable** (a judgment call, logged here rather than
silently decided): the homepage feature-highlight cards, the how-it-works step
cards, and the about-page "values" grid. These read as generic design/marketing
copy rather than business facts a new owner would need to change day-to-day -
making every card on every page admin-editable would mean building real CMS
infrastructure and an unusably long settings form to solve a problem this
business likely doesn't have. Listed in the recommendations above if this
judgment call is ever worth revisiting.

**5. Bank transfer + Stripe payment settings - the security-sensitive centerpiece
of this round.** The request was explicit and non-negotiable: the Stripe secret
key must never be stored in the database or admin-editable (this project has
fully open RLS everywhere and a plaintext admin password - a secret key in
`site_settings` would be readable by anyone with the anon key), and the bank
account number is business-identifying data that shouldn't sit in a table the
anon key can read wholesale.

The judgment call this required: how to have a table that's genuinely unreadable
by the anon key while still being usable by backend admin endpoints, given the
backend authenticates to Supabase with the anon key for literally everything
else in this project. Resolution: a new `payment_settings` table (bank account
number/name, Stripe's non-secret config - publishable key, currency, enabled
toggles, success/cancel URLs) with RLS **enabled and given no
anon/authenticated policy at all** - a deliberate, first-of-its-kind departure
from this project's "everything open" RLS convention, done narrowly for this one
sensitive table rather than as a general fix. Backend access goes through a new
`get_supabase_admin_client()` (the service-role key, which bypasses RLS - it was
already sitting in `.env` unused, documented as "reserved for future" since
round one, and this is that future). I verified this actually works as intended
by querying the live Supabase project directly with both keys: the anon key gets
`[]` back from `payment_settings`, the service-role key gets the real row.
Public access goes through a new, narrow `GET /api/payment-config` endpoint that
returns only the specific fields checkout needs (including the bank account
number itself, deliberately - customers need to see it to pay by transfer) -
never a blanket dump of the row, and never the admin-only success/cancel URL
fields.

Stripe integration is built entirely on raw REST calls via `requests` - no
`stripe` PyPI package, since installing one would violate "no new installs" just
as much as an npm package would. Checkout session creation
(`POST /api/checkout/stripe-session`) and webhook signature verification
(`POST /api/webhooks/stripe`) are both hand-implemented against Stripe's
documented API/HMAC scheme, the same pattern this backend already uses for
Supabase itself. Both are guarded for the fact that no real Stripe credentials
exist: `is_stripe_configured()` checks that `STRIPE_SECRET_KEY` actually starts
with `sk_` rather than just checking it's set, specifically because
`backend/.env` ships with a `your-stripe-secret-key`-style placeholder that
would otherwise read as "configured" and send a real API call out with a bogus
key. Without a real key, checkout correctly returns 503 rather than crashing or
erroring oddly. Without `STRIPE_WEBHOOK_SECRET` set, the webhook endpoint
acknowledges requests but deliberately does nothing else - it never marks an
order paid from an unverifiable payload, since that would be a free way to fake
a successful payment; this was a conservative choice I made rather than
defaulting to "trust it anyway," per the standing "choose the conservative
option on judgment calls" instruction.

**What was actually verified vs. what's blocked pending credentials:** the full
non-Stripe-API parts of this were verified end-to-end against the real project -
admin-set bank details appearing correctly on the live cart page, the Stripe
toggle correctly showing/hiding the card payment option, and a real checkout
attempt (with the placeholder secret key) correctly failing closed with a 503
while preserving the order and cart rather than losing them. The webhook
signature verification logic is fully unit-tested with a synthetic secret
(valid signature accepted, wrong secret/tampered payload/stale timestamp all
rejected, malformed header doesn't crash) - this doesn't need a real Stripe
account to test correctly, since it's just HMAC-SHA256 either way. What's
genuinely blocked: an actual successful payment through Stripe's real API (would
need a live or test-mode Stripe account, which doesn't exist), and receiving a
real webhook from Stripe's servers (same reason). Both are pieces a developer
needs to complete once Mujtaba/the eventual owner has a Stripe account - exactly
which env vars to paste where is documented in `backend/README.md`.

Test suite grew from 72 to 99 backend tests this round (bookings/orders
cancel-delete, image upload validation, the new settings fields' round-trip,
payment config's public/admin field split, Stripe's configured-check and
checkout-session logic with the Stripe API call itself mocked, and the full
webhook signature verification suite). All passing; frontend build clean;
`SECURITY_DEBT.md` updated to reflect item 4 as fixed and to document the new
`payment_settings` table as a deliberate, one-off exception to item 1.

---

## Round four (closing round - see "Start here" above for the recommendations
## this round's work fed into)

Explicit instructions this round: close out rather than expand scope. Finish the
`service_area_note` bug-class sweep, confirm the round-three mobile fix holds, add
frontend test coverage for the booking/calendar path (only if no new dependencies
needed), then do a proper handover - complete `OVERNIGHT_NOTES.md`, a real project
README, and a prioritized recommendations list. Explicitly told not to start
anything from that list.

### [R4-1] Finished the `service_area_note` bug-class sweep, both directions

**Display side** (a field is editable but nothing shows it): checked every field
the real admin Settings form sends against actual usage on the public site
(`grep` for each of the 15 field names across every non-admin-form `.tsx` file).
All 15 are genuinely displayed somewhere - `service_area_note` (fixed last round)
was the only one with this problem. `logo_url` exists in the schema/types but has
no admin UI field and nothing renders it either - left alone, since unlike
`service_area_note` there's no existing UI implying it should do something; it's
an unbuilt feature, not a broken promise.

**Save side** (the mirror-image bug): `update_settings()` in `admin_settings.py`
silently drops any field not in its `SETTINGS_FIELDS` whitelist tuple - no error,
200 response, the field just never gets written. Confirmed by hand that today's
whitelist matches today's form field-for-field, then added
`backend/tests/test_admin_settings.py` (6 tests) so that stays true: PUTs every
field the real form sends, GETs it back, asserts each one round-tripped. This is
regression protection specifically against a future form field being added
without remembering to whitelist it on the backend - exactly how
`service_area_note` likely happened in the first place, just for a field that
already existed everywhere instead of the wiring being missing entirely.

### [R4-2] Confirmed the round-three admin mobile fix still holds

No code changes needed - `grep` confirmed the `pathname?.startsWith('/admin')`
check is still in place in both `SiteHeader` and `SiteFooter`, unchanged since
round three landed it. Logged as explicitly checked rather than assumed, per the
instruction to close this out.

### [R4-3] Frontend test coverage for the booking/calendar path

Extracted two more pieces of calendar logic into `frontend/lib/date-utils.ts`
(joining `toDateOnly`/`isWithinAuckland` from earlier rounds), removing
duplication and making them independently testable:

- **`fromDateOnly()`** - the inverse of `toDateOnly`, parsing `"YYYY-MM-DD"` into
  a local-midnight `Date`. Was duplicated inline in the admin Rentals page's
  calendar-modifier conversion. Comes with the mirror-image regression guard of
  `toDateOnly`'s: never use `new Date(dateStr)` for this, since that parses as
  UTC midnight - the same off-by-one-day bug as `toISOString()`, just running
  the other direction.
- **`isDateAvailable()`** - the actual logic deciding whether a customer can pick
  a date on the booking calendar: not in the past, not in the global
  blocked-dates set. Takes `today` as a parameter (default `new Date()`)
  specifically so it's testable against a fixed date instead of whatever day the
  test suite happens to run on - this is the highest-value piece of this
  session's ask, since it's the actual gatekeeper logic for the feature the
  whole engagement was originally about.

Also removed `blockedDateSet` in the admin Rentals page - a computed value that
was assigned but never read anywhere, found while touching this code for the
`fromDateOnly` swap. Added 9 new tests (7 → 16 total in
`frontend/lib/date-utils.test.ts`).

**Verified live after the refactor**, not just via unit tests: selected a date on
the real product page's calendar (confirms `isDateAvailable`'s actual call site
still works after the extraction), blocked a date on the real admin Rentals
calendar and confirmed it visually renders with the "blocked" style (confirms
`fromDateOnly`'s actual call site - the calendar's date-modifier conversion -
still works), cleaned up all test data afterward.

### [R4-4] Handover

Wrote the root `README.md` (didn't exist before this engagement - see the
`ADMIN_BACKEND_SETUP.txt` note in round one/two about the earlier docs being
deleted in the Django→Flask migration and never replaced). Verified the
documented backend run command actually works by running it
(`venv/Scripts/python.exe backend/web.py` from the repo root, hit
`/api/health`, got a clean 200) rather than just writing down what I assumed
would work - then made sure to actually clean up the process afterward
(Flask's debug reloader runs as more than one process; a plain `kill` on the
shell job left a child still listening on port 5000, caught by checking
`netstat` after, not by assuming the kill worked).

This file's "Start here" section at the top (see above) is the other half of
the handover - an index across all four rounds plus the final prioritized
recommendations list, so this file works as a complete standalone record
rather than requiring the chat history it came from.

### Verification this round

Backend suite: 52 → 58 tests. Frontend suite: 7 → 16 tests. Both suites and a
full `npm run build` verified passing before every commit this round. DB row
counts checked against baseline before and after every live verification pass -
unchanged from every previous round's baseline (products 8, bookings 4, orders
4, messages 3, payments 4, blocked_dates 0, delivery_options 2, site_settings
1). All test data created this round (a blocked test date, form-submitted test
settings values) was deleted or reverted immediately after confirming it worked.

### Commit log, round four (oldest first)

1. `test: settings save/load round-trip - the service_area_note bug class`
2. `test: frontend coverage for the booking/calendar availability logic`
3. (this file, and the new root `README.md` - committed together as the
   handover)

All local only - no remote configured, nothing pushed, nothing deployed.

---

## Side request, mid-round-three: deleted backend/.env.example

Mujtaba's explicit decision: not rotating the service-role key (repo is private,
and the real values were scrubbed before they ever entered git history - see round
one's [1] entry below). He asked for `backend/.env.example` deleted outright, since
its mere presence implies "safe template, fill in and commit" - which is exactly
the mistake round one caught and fixed once already.

Before deleting, per his explicit instructions, checked:
- **Nothing references it by path** anywhere in the repo (code, `render.yaml`, or
  docs) except this file's and `SECURITY_DEBT.md`'s own historical account of
  finding real secrets in it - left those alone, they describe a past incident,
  not a dependency on the file existing.
- **`backend/.env` is present and gitignored** - confirmed with
  `git check-ignore -v backend/.env` (matches `.gitignore:44`).
- **It was the only place the backend's variable-name list was documented
  anywhere in the repo.** There's no root README (deleted in the earlier stack
  migration, never replaced). The pile of `ADMIN_*.md` docs only ever mention the
  *frontend's* `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` pair - a
  stale, currently-unused variable pair from an earlier design where the frontend
  talked to Supabase directly (it doesn't today - `frontend/lib/supabase/client.ts`
  is an intentional unused stub, per `SECURITY_DEBT.md`). None of them document the
  backend's actual list (`SUPABASE_URL`, `SUPABASE_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS`, etc).

Since it was the only record, moved the variable list into a new
**`backend/README.md`** (placeholder values only, same as `.env.example` had)
before deleting the file - didn't just delete and lose the reference. Also noted
which variables are actually read by the code today (`SUPABASE_URL`/`SUPABASE_KEY`
only, confirmed by grepping every `.py` file for each variable name) versus
informational/deploy-time-only/reserved-for-unbuilt-features, so that distinction
survives too. Verified the full backend test suite still passes (nothing in the
codebase ever imported or read `.env.example` itself). Committed separately:
`docs: replace backend/.env.example with backend/README.md env var reference`.

---

## Round three (this section first, most recent; earlier rounds follow below)

Mujtaba clarified the previous stop was based on a misread - the "test suite" work
that triggered it was actually verification of already-completed round-two work, not
new scope creep. Confirmed on resuming: `git status`/`git log` showed round two's 5
priorities genuinely complete and committed (see "Round two summary" below) before
the stop instruction arrived. Rather than redo anything, this round went deeper on
each priority and kept sweeping for bugs. Same standing rules throughout: local
commits only, additive DB changes only, no new installs/ports/permissions.

### [R3-1] Two real correctness bugs found and fixed, with regression tests

**`admin_change_password` checked the wrong password store.** It compared the
submitted current password against the in-memory `ADMIN_USERS` fallback only -
never against the actual Supabase `admin_users` row, unlike `admin_login` which
already checks Supabase first and falls back to memory. Since the entire reason the
password lives in plaintext in Supabase is so it can be read and managed directly
from the database, this meant: change the password in Supabase, then try "Change
Password" in the admin UI with that now-correct value, and it would be rejected as
"incorrect" because the code was still comparing against the stale in-memory
`'changeme123'` default. Fixed to check Supabase first (same priority as login),
updating both stores on success. Added `test_admin_auth.py` (11 tests, including a
regression test that seeds a Supabase-only password, logs in with it, and confirms
change-password now accepts it). This is a functional-correctness fix, not a
security-posture change - the password is still plaintext, still stored the same
way; this only makes the check consult the right source of truth. Not something in
`SECURITY_DEBT.md` and not touched as if it were.

**Checkout could produce duplicate orders.** `handleCheckout` created the order,
then created a separate `payments` row in a second request. If that second request
failed for any reason, the order already existed but the customer saw an error and
their cart was NOT cleared - the obvious next step is to click "Place Order" again,
creating a second, duplicate order for the same cart. The `payments` row is purely
supplementary (the order already stores `payment_method` and `total` directly), so
made it best-effort: a failure there is logged to the console but no longer blocks
the success path or leaves the cart non-empty. Verified live by simulating the
payments endpoint failing - confirmed exactly one order existed afterward (not
two), cart cleared, success toast shown. This is exactly the "costs money or
double-books" class of bug the priorities called out, just on the shop-order side
rather than the rental-booking side (which was already fixed in round two).

Also finished a systematic re-sweep for phantom status values and dead handlers
across every file (grepped every `status ===`/`eq('status', ...)` literal in both
frontend and backend against the real CHECK constraints, grepped for empty
`onClick={() => {}}` handlers, grepped for `TODO`/`FIXME` markers) - nothing else
turned up. The sweep from here forward is "check as you touch things," not a
standing backlog.

### [R3-2] Admin usability: public site chrome was leaking into every admin page

Testing at a real mobile viewport (375x812 - this hadn't actually been done before,
only assumed via `overflow-x-auto`) surfaced something not visible on desktop:
every `/admin/*` page rendered the full public storefront header (logo, shopping
cart icon, marketing nav, hamburger menu) directly above the Admin Console header,
and the marketing footer below the admin content - because the root layout wraps
every route unconditionally. On mobile this meant **two hamburger menus stacked on
one screen** and a large fraction of a small viewport gone before any admin content
appeared. Not a "bug" in the sense of broken functionality, but definitely not
"workable on mobile" and not something a real admin dashboard should show at all,
on any screen size.

Fixed with a pathname check in `SiteHeader`/`SiteFooter` (both already client
components) - they return `null` for any `/admin/*` route. Considered restructuring
into Next.js route groups instead (the "proper" way to give a route subtree a
different layout) but that means moving every public page file into a new folder,
which is a lot of surface area to touch for a change that a two-line pathname check
achieves with equivalent effect and far less risk of breaking a public route's URL.
Verified live: admin pages now show only the Admin Console header at both desktop
and mobile widths; separately confirmed the public homepage at the same mobile
viewport is pixel-for-pixel unchanged (nothing about the "approved look and theme"
was touched - this check only ever fires on `/admin/*`).

### [R3-3] Two more real bugs found by re-verifying round two's own resilience fix

Went back and empirically re-tested round two's "malformed JSON returns clean
400/415" fix with `curl` against the actually-running dev server, rather than
trusting that adding the global handlers in `web.py` was the whole story. It wasn't:

**Every `admin_*.py` endpoint downgraded a clean 400/415 into a misleading 500.**
Each one wraps its entire body - including the `request.get_json()` call - in one
broad `except Exception`. Flask's `get_json()` raises a werkzeug
`BadRequest`/`UnsupportedMediaType` on malformed JSON or a missing `Content-Type`
header, and those exceptions ARE `Exception` subclasses, so the broad `except`
caught them *before* they could reach the global handlers round two added -
converting a correctly-classified 400/415 client error into a generic 500
`"Internal server error"` with a raw Postgres-adjacent-looking traceback string
leaked into the response. Confirmed with `curl` before touching anything: a valid
admin token + malformed JSON against `/api/admin/products` returned 500 with
`"Failed to decode JSON object"` in the details field. Fixed by switching every
`request.get_json()` call to `request.get_json(silent=True)` - 10 call sites across
the 6 `admin_*.py` files, plus the 11 inline calls in `route.py`'s public route
registrations (same underlying issue there, and it unifies the error message with
each endpoint's own `require_body`-based wording instead of the generic global
handler text). Reconfirmed with `curl` after the fix: clean 400 every time. Added 4
regression tests hitting this exact scenario against three different admin
endpoints, explicitly asserting `!= 500`.

**`service_area_note` was editable but connected to nothing.** This setting has
existed in `site_settings` and the admin Settings form since the very first
session, but nothing on the public site ever read it - an admin could type
something in and hit Save, and literally nothing visible would happen anywhere.
Its default value is word-for-word the second sentence of the Rentals page's
hardcoded intro paragraph, which is a strong signal this was the intended
destination and it simply never got wired up. Fixed: Rentals page now renders that
sentence from `useSiteSettings()` instead of a hardcoded literal. This is the same
"control that does nothing" bug class from the correctness-sweep priority, just
applied to a settings field instead of a button - worth checking other unused
`site_settings` columns the same way if this keeps coming up (`logo_url` is defined
in the schema/types but has no admin UI field and nothing renders it either - left
alone since, unlike `service_area_note`, there's no existing UI promising it does
something; it just doesn't exist as a feature yet, which isn't a bug).

### [R3-4] How It Works page hero → editable from site_settings

After the side request (see the top of this file - deleting `backend/.env.example`),
resumed with one more increment of the same hero-content pattern from round two:
`how_it_works_heading`/`how_it_works_subheading` added to `site_settings`
(additive migration, defaults equal to the exact previously-hardcoded copy), a new
"How It Works Page" card in `/admin/settings`. This was the last of the three major
page heroes (Home, About, How It Works) left hardcoded - all three now go through
the same DB-driven pattern. Left the 4-step process list and 3 info cards on the
same page hardcoded, consistent with round two's "one substantial block per page"
call on the About page.

Verified: page renders identically before any edit; edited the heading directly in
the database and confirmed the live page reflected it immediately; separately
confirmed the admin settings form correctly loads that same value back out of the
real `GET /api/settings` response into its input field (round-tripping through the
actual API, not just checking the database) - a slightly more thorough check than
the previous two hero migrations got, and it passed. Reverted to original copy
afterward.

### Verification this round

Backend suite is now 52 tests (was 37 at the start of round two, 48 after the first
half of round three), still zero new dependencies, confirmed passing twice in a row
for test isolation. Frontend suite unchanged at 7 tests, typecheck clean. Full
`npm run build` passes after every commit in this round. Mobile viewport (375x812)
actually tested (not just assumed) on `/admin/products` and `/admin/rentals` after
the header/footer fix - both genuinely usable: single-column layouts stack
correctly, the calendar fits and is touch-usable, wide tables scroll horizontally
within their own container (confirmed the scrollbar is on the table, not the page).
DB row counts checked against baseline before and after every live verification
pass throughout this round - unchanged (products 8, bookings 4, orders 4, messages
3, payments 4, blocked_dates 0, delivery_options 2, site_settings 1) - every piece
of test data created during verification (test products, test bookings, test
orders, test settings edits) was deleted or reverted immediately after confirming
it worked.

### Round three summary

All 5 priorities got real, verified work - two of the five findings this round
(`admin_change_password`'s wrong password source, the malformed-JSON 500s) were
found specifically *by* re-verifying round two's own claimed fixes empirically
rather than trusting the code read-through, which is the pattern worth repeating:
test the actual running server, not just the diff.

1. **Test suite**: 37 → 52 backend tests, 7 frontend tests unchanged, zero new
   dependencies throughout.
2. **Correctness sweep**: finished the systematic re-check (phantom status values,
   dead handlers) and found two bugs the sweep-by-reading missed:
   `admin_change_password`'s stale password source, and the checkout
   duplicate-order risk.
3. **Resilience**: found and fixed the malformed-JSON-becomes-500 regression across
   every admin endpoint - this is the single most impactful fix this round, since
   it affects literally every admin write endpoint the same way.
4. **Admin depth**: fixed the public-header/footer-leaking-into-admin-pages issue,
   verified genuinely mobile-usable at a real viewport for the first time.
5. **DB content**: fixed `service_area_note`'s dead wiring (a real bug fix, not new
   surface - prioritized over new customization given what the sweep turned up),
   then added the How It Works page hero to the same pattern as round two's
   Home/About heroes - all three major page heroes are now DB-driven.

### Needs permission / blocked (unchanged from round two)

Still just the Auckland postcode range question from round two's [R2-1] - needs an
authoritative external NZ postcode source, which this round's rules don't allow
reaching for. Nothing new got blocked this round.

### Commit log, round three (oldest first)

1. `docs: round three progress checkpoint` (mid-round checkpoint, superseded by this
   final summary)
2. `fix: change-password checked stale in-memory data, not Supabase`
3. `fix: checkout could produce duplicate orders on a payment-record failure`
4. `fix: admin pages no longer show the public storefront header/footer`
5. `fix: malformed JSON on any endpoint returned 500 instead of 400/415`
6. `fix: service_area_note setting was editable but never displayed anywhere`
7. `docs: round three final summary`
8. `docs: replace backend/.env.example with backend/README.md env var reference`
   (side request, see the top of this file)
9. `docs: note the backend/.env.example deletion side request`
10. `feat: make How It Works page hero editable from admin settings`

All local only - no remote configured, nothing pushed.

---

Told to stop immediately so the machine could go quiet - this section is that
wrap-up, written before the machine was put to sleep.

**State at stop time: clean. Nothing was mid-edit, nothing was abandoned
half-finished, nothing was reverted.** The last piece of round two work (About page
content customization, see "Round two" below) had already been finished, verified
live in the browser, reverted back to baseline data, and committed *before* the stop
instruction arrived. When the stop instruction came in, `git status` showed only the
one pre-existing unrelated file that was never touched all session
(`.claude/settings.local.json` - a Claude Code permissions-list file, not app code).

What was done in response to the stop instruction itself:
1. Checked `git status` - confirmed no half-finished edit existed anywhere.
2. Nothing to revert (see above).
3. Ran `npm run build` in `frontend/` one more time - passed clean, all 16 routes.
4. Checked for running dev servers (`preview_list` showed none active - they'd
   already been stopped at the end of round two) and checked `netstat`/`tasklist`
   directly for anything still listening on ports 3000/5000 or any stray
   node.exe/python.exe process - found nothing. The machine was not actually running
   any of my dev servers at the moment the stop instruction arrived.
5. Nothing new to commit (see #1) - the tree was already fully committed.
6. This note.
7. Sleep command runs immediately after this file is saved and committed - see the
   very end of this entry for exactly what was run.

**If it still felt like the machine was making noise/working** right when the stop
instruction came in, it wasn't a leftover dev server or background process from this
session - there wasn't one running. It may have been the build check in step 3
above (a `next build` briefly uses real CPU, finishes in well under a minute) or
something unrelated to this session entirely.

### What to check when you're back

Nothing is broken or waiting on you from an in-progress-work standpoint - round two
finished cleanly before this stop instruction arrived. The one substantive thing
worth your attention is in round two's "Needs permission / blocked" section below:
the Auckland postcode list used for delivery-fee logic covers a wider range
(0600-2999) than the real Auckland region, and correcting it needs an authoritative
NZ postcode source that this session couldn't reach under the no-new-network-calls
rule. Flagged in `frontend/lib/date-utils.ts` and in round two's notes - not fixed.

Everything else - what got built, what got tested, what's still deferred - is in the
"Round two" and "Round one" sections below, unchanged from before this stop
instruction (nothing in them needed correcting).

---

## Round two (this section first, most recent work; round one log follows below)

Second unattended session, same constraints as round one plus: no new installs, no
new ports, no new permissions, no new external network calls beyond what round one
already used (Supabase MCP, local dev servers, local git). Priorities: work through
what round one deferred, add automated tests without new dependencies, finish the
correctness sweep, go deeper on admin UX, and harden the Flask side against bad
input/missing records/an unreachable Supabase. Do not act on SECURITY_DEBT.md.

### [R2-1] Correctness sweep, continued

Found and fixed a real bug in `frontend/hooks/use-api.ts`: its second parameter was
typed as `initialData`, but all three call sites (`Home`, `Rentals`, `Shop`) call it
as `useApi(fetchFn, [])`, clearly intending `[]` as a dependency array. Since
`[] !== null`, the hook's `loading` state incorrectly initialized to `false`, so the
loading skeleton never appeared during the very first fetch on any of those three
pages - it would briefly render the "no results" empty state instead. Fixed by
dropping the parameter that was never actually used as intended by any caller.

Also found in `backend/app/view.py`: five `update_*` view functions
(`update_product`, `update_booking`, `update_availability`, `update_order`,
`update_payment`) returned **200 with a null body** when the target id didn't exist,
instead of 404 - silently "succeeding" at updating something that was never found.
The equivalent `admin_*.py` endpoints already had this right; only the public
`view.py` versions had the bug. Fixed all five, with regression tests.

Extracted duplicated logic while fixing/testing it: `toDateOnly` existed separately
in the product page and the admin rentals page; `isWithinAuckland` and its postcode
list only existed in the product page but deserved to be testable on its own. Both
now live in `frontend/lib/date-utils.ts`, imported by both consumers.

**Data-correctness note, not fixed**: the Auckland postcode list
(`AUCKLAND_POSTCODES`) spans `0600`-`2999`. Real Auckland postcodes don't reach that
high - the upper end of that range is Horowhenua/Wairarapa territory, well south of
Auckland (hours past Wellington's rural hinterland). This determines whether a
customer gets charged an out-of-area delivery fee, so it's a real business-logic
concern, not cosmetic. **Did not attempt to correct it** - fixing it right needs an
authoritative NZ postcode-to-region mapping to check against, and this round's rules
explicitly disallow new external network calls (which is what looking that up would
need). Flagged in a comment in `date-utils.ts` and here. This is the single most
concrete "needs permission" item from this round - see that section below.

Also removed two unused imports in `admin_dashboard.py` (`get_all_sessions`, `uuid`)
found while reading through every backend file line by line for the sweep.

### [R2-2] Automated tests (none existed before this)

**Backend** (`backend/tests/`, 37 tests): `unittest` + Flask's own `test_client()` -
both already present with no new install (`test_client()` ships with Flask itself).
A hand-rolled `FakeSupabaseClient` (`fake_supabase.py`) stands in for the real REST
client so tests exercise actual Flask routing/view code with zero network calls to
the live project, including enforcing the one UNIQUE constraint the booking-race fix
depends on (`blocked_dates.date`). Covers: the global calendar blocking a date across
every product, the booking race-condition fix and its rollback path, 404s on missing
records, auth gating on every admin endpoint, the product slug/base_price fix,
blocked-date and delivery-option conflict handling, Supabase-unreachable → 503
translation, and session expiry. Run with:
`venv/Scripts/python.exe -m unittest discover -s backend/tests -p "test_*.py" -v`

**Frontend** (`frontend/lib/date-utils.test.ts`, 7 tests): Node 22+'s built-in
`node:test` + `node:assert`, which can import `.ts` files with simple type
annotations directly - confirmed this empirically before relying on it, no
ts-node/jest/vitest needed. Covers `toDateOnly` (including a regression guard
against the exact `toISOString()` timezone bug that shipped once already) and
`isWithinAuckland`. Run with `npm test` (added as a package.json script) or
`node --test`.

Excluded `**/*.test.ts` from `frontend/tsconfig.json` - Node requires the `.ts`
extension in the test file's own import path to resolve it, but `tsc` rejects
explicit `.ts` extensions in imports by default; excluding test files from the app's
typecheck avoids the conflict without loosening `tsc` for real app code. Verified
`npm run typecheck` and `npm run build` both still pass clean after this.

Full backend + frontend test runs, plus a full `npm run build`, all verified passing
before every commit in this section.

### [R2-3] Flask resilience pass

Empirically tested (via `app.test_client()`, not just read the code) what happens on
bad input before "fixing" anything, since the prior round's notes already flagged
this as unverified:
- No `Content-Type: application/json` → Flask's own 415, HTML body.
- Malformed JSON body → 400, HTML body.
- Empty body → 400, HTML body.
- Literal `null` body → 200, `None` passed straight through to the view function.

None of these crashed (no 500/debugger), but the first three broke the API's own
"always JSON" contract, and the fourth meant a `null` body reached
`supabase.table(...).insert(None)` with no validation at all. Fixed:
- Added global `@app.errorhandler(400)` / `@app.errorhandler(415)` in `web.py`
  returning this API's normal `{'error': ...}` shape instead of Flask's default HTML
  page.
- Added a `require_body()` guard plus required-field checks (booking needs
  product_id/customer_name/contact/event_date, etc.) to every public create/update
  view, so a bad request gets a specific, correct-status-code answer instead of
  whatever error Postgres happens to produce three calls later.
- No request to Supabase had a timeout - a hung connection would hang the Flask
  request indefinitely. Added a 10s timeout to every call in `supabase_client.py`.
- A network failure reaching Supabase (unreachable, DNS failure, timeout) surfaced as
  a raw `requests` exception with the wrong status code. Now becomes
  `SupabaseError(503, ...)` with a clear message; `handle_error()` maps SupabaseError
  status codes (503/409/etc) to a short human-readable summary instead of always
  answering 400 with a raw Postgres/PostgREST error string.

All of the above has passing regression tests (see R2-2).

### [R2-4] Admin UX depth pass (priority 4)

Went through every admin page (dashboard, products, orders, rentals, settings) with
the same checklist:

- **Real error messages.** Every page had generic strings like "Failed to update
  product" regardless of why. Added a small `describeError()` helper (reads
  `body.error` from the failed response) to each page, so the specific backend
  message now surfaces - e.g. "That date is already blocked" instead of "Failed to
  block date", "Missing required field(s): event_date" instead of a silent no-op.
  Network failures (server unreachable) get their own distinct wording so it's
  obvious the problem isn't "you did something wrong."
- **Confirmation on destructive actions.** Product delete already had this. Added it
  to the Rentals page's list-based "unblock a date" action (names the date, extra
  wording if it's linked to a booking) - this had briefly lost its confirmation
  earlier in the session as a workaround for the sandboxed test browser not
  supporting `confirm()`; restored now that it's confirmed working normally, and
  verified both the decline path (nothing happens) and the confirm path (date
  actually unblocks) live.
- **Loading states.** Rentals page's Blocked Dates and Delivery Options lists would
  flash their "no data" empty state before the first fetch completed - same bug
  class as the `useApi` fix, just hand-rolled fetch logic instead of the shared
  hook. Added proper loading guards.
- **In-flight protection.** Product add/edit/delete buttons now disable themselves
  while their request is running, so a double-click can't fire two overlapping
  requests.
- **Dashboard and Settings previously swallowed load failures** (console.error only,
  leaving stats as "-" or the settings form blank with zero explanation). Both now
  show a visible error banner.

Verified live for real (not just read the code): created and deleted a test product
through the actual confirm dialog (checked both the decline-does-nothing path and the
confirm-actually-deletes path via the dialog's message text), blocked/unblocked a
date on the calendar and via the list's confirm dialog, changed an order status and
saw the success message. All test data cleaned up / reverted afterward. Full
production build and the 37-test backend suite both pass after this batch.

### [R2-5] Continuing DB-driven content customization (priority 1 + 4)

Extended the hero pattern from round one to the About page: `site_settings` gained
`about_heading`/`about_subheading`/`about_story` (additive migration, defaults equal
to the exact previously-hardcoded copy). The three story paragraphs are one textarea
in the admin (split on blank lines to render), not one column each - enough to be
useful without turning this into a full page-builder in a single sitting. The "Hi,
we're Bloom & Vow" line now also pulls the site name from settings instead of
hardcoding it a second time elsewhere on the same page.

Deliberately did **not** extend this to the About page's "Values" grid (4 icon/title/
description cards) or the How It Works page's 4 steps - picked the single most
substantial editable block per page rather than making every hardcoded string on the
site dynamic in one pass. If this keeps being useful, those are the natural next
targets, same pattern each time.

Verified live: About page renders identically before any edit; edited the heading
through the new admin card, confirmed the DB updated and the live page reflected it
immediately, reverted back to original copy afterward.

## Round two summary

All 5 round-two priorities got a real pass, verified rather than assumed:

1. **Worked through round one's deferred items** - the About page content
   customization (this round's [R2-5]). True DB transactions for booking creation
   remain out of scope (would need a Postgres RPC function - more infrastructure
   than "no new installs/ports" allows building carelessly at 3am; noted, not
   attempted, matches round one's own call on this).
2. **Automated tests added from zero** - 37 backend tests (`unittest` + Flask's own
   test client, no new dependency) and 7 frontend tests (Node's built-in `node:test`,
   confirmed empirically that Node 22+ runs `.ts` files with simple type annotations
   directly before relying on it). Both suites run clean; commands are in each
   section above and in the repo (`npm test` in `frontend/`, the unittest discover
   command in `backend/tests/`).
3. **Correctness sweep finished** - found and fixed the `useApi` loading-state bug,
   the five `update_*` 404-vs-200-null bug, two unused imports, and flagged (without
   guessing at a fix) the Auckland-postcode-range data concern.
4. **Admin UX depth** - real error messages everywhere, confirmations restored,
   loading states fixed, in-flight double-submit protection, plus the About page
   customization work.
5. **Flask resilience** - timeouts on every Supabase call, clean 503s instead of raw
   connection exceptions, global 400/415 JSON error handlers, required-body/
   required-field validation on every public create/update endpoint.

### Needs permission / blocked (nothing else came up)

- **Auckland postcode list correctness** (flagged in [R2-1]) - the only concrete item
  that needs something this round's rules don't allow: an authoritative NZ
  postcode-to-region source to check the existing `0600`-`2999` range against, which
  means an external network call. Left as-is, documented in `date-utils.ts` and here.
  This affects whether a real customer gets charged an out-of-area delivery fee, so
  it's worth someone (with real NZ Post/postcode data access) checking before this
  matters for a real booking.
- Nothing else was blocked. Every other task fit inside file edits, the already-
  running local dev servers, the already-connected Supabase MCP, and local git.

### Commit log, round two (oldest first)

1. `docs: round two progress checkpoint (sweep, tests, resilience)`
2. `fix: Flask resilience - timeouts, clean error responses, 404s on missing records`
3. `test: add backend test suite (unittest + Flask test client, no new deps)`
4. `fix: useApi loading-state bug; extract+test date-utils (no new deps)`
5. `feat: admin UX depth pass - real errors, confirmations, loading states`
6. `feat: make About page story content editable from admin settings`

All local only - no remote configured, nothing pushed. DB row counts and content
verified back to exact starting state after every test/verification pass (checked
right before writing this line: products 8, bookings 4, orders 4, messages 3,
payments 4, blocked_dates 0, delivery_options 2, site_settings 1 - matches both
round one's and round two's starting baseline).

---

## Round one (original session)

**Status as of round one's end: all 5 stated priorities had a first pass done and
verified. Tree was committed, built clean, DB was back to its exact starting row
counts and values.** See "What's left / natural next steps" below for what round one
deferred - most of it is what round two above is working through.


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

