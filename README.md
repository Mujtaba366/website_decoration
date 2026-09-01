# Bloom & Vow — business website

A wedding decoration rental + shop storefront with an admin panel, for a
2-person Auckland-based business. Customers browse and reserve rentals or buy
keepsakes; the business owner manages products, bookings, orders, delivery
options, and site content from `/admin`.

There is no README history in this repo before this one - an earlier
Django/Vite version of this project was replaced with the stack below, and no
top-level setup doc survived that migration. If you're new to this repo,
start here, then see the docs listed at the bottom for everything else.

## Stack

- **Frontend**: Next.js 13 (App Router) + TypeScript + Tailwind + shadcn/Radix
  components, in `frontend/`.
- **Backend**: Flask API, in `backend/`. Talks to Supabase via a small
  hand-rolled REST wrapper (`backend/app/supabase_client.py`) - not the
  official `supabase-py` client.
- **Database**: Supabase (Postgres + REST API). Schema lives in
  `frontend/supabase/migrations/` and `supabase/migrations/`.

The frontend never talks to Supabase directly - every request goes through
the Flask backend, including the public storefront reads. There is no
frontend Supabase client in active use.

## Prerequisites

- Python 3.14 (a `venv/` already exists at the repo root with dependencies
  installed - see below)
- Node.js - tested on 24.18. The test setup relies on Node's native ability
  to run `.ts` files without a build step, which needs at least Node 22.6
  (unflagged since 23.6) - untested on versions between 22.6 and 24.
- A Supabase project with this app's schema applied (see
  `frontend/supabase/migrations/` and `supabase/migrations/` for the full
  history of what's been applied to the live project)

## Running locally

**Backend** (from the repo root):
```
venv/Scripts/python.exe backend/web.py
```
Needs `backend/.env` to exist first - see `backend/README.md` for the full
list of variables it reads, since there's no `.env.example` (deliberately
removed - see `OVERNIGHT_NOTES.md`'s side-request entry for why). At minimum
it needs `SUPABASE_URL` and `SUPABASE_KEY` (the Supabase anon key) to do
anything useful. Runs on `http://127.0.0.1:5000`.

**Frontend** (from `frontend/`):
```
npm install
npm run dev
```
Runs on `http://localhost:3000`. No `.env.local` is required for local dev -
it defaults to talking to the backend at `http://localhost:5000/api`. Set
`NEXT_PUBLIC_API_URL` in a `.env.local` only if your backend is running
somewhere else.

With both running, visit `http://localhost:3000` for the storefront and
`http://localhost:3000/admin` for the admin panel (see `backend/README.md`
or ask Mujtaba for the current admin credentials - they live in the
`admin_users` table in Supabase, in plaintext, on purpose - see
`SECURITY_DEBT.md` for why that's a deliberate, revisit-later choice rather
than an oversight).

## Tests

Neither suite needs anything installed beyond what's already in
`requirements.txt`/`node_modules` - no pytest, no jest/vitest.

**Backend** (from the repo root):
```
venv/Scripts/python.exe -m unittest discover -s backend/tests -p "test_*.py" -v
```
Uses Python's built-in `unittest` + Flask's own test client, with an
in-memory fake standing in for Supabase (`backend/tests/fake_supabase.py`) -
no network access or real credentials needed to run it.

**Frontend** (from `frontend/`):
```
npm test
```
Uses Node's built-in test runner (`node --test`) against pure-logic modules
in `frontend/lib/` - no component/DOM testing framework is set up, so this
covers date/timezone/availability logic, not UI rendering.

## Where things are

- `backend/README.md` - backend environment variables, in detail.
- `SECURITY_DEBT.md` - known security gaps, documented on purpose and
  explicitly **not** to be fixed without checking with Mujtaba first (the
  plaintext admin password is a deliberate, informed choice for now, not a
  bug).
- `OVERNIGHT_NOTES.md` - a chronological log of unattended work sessions on
  this repo: what was built, what bugs were found and fixed, what was
  deliberately deferred and why, and a prioritized list of recommended next
  steps. Worth reading before making significant changes, since it has the
  reasoning behind a lot of non-obvious decisions already made in this
  codebase.
- `render.yaml` / `netlify.toml` - deploy configuration for Render (backend)
  and Netlify (frontend). Present for whenever this is ready to deploy;
  nothing has actually been deployed from this repo, and none of the
  automated work referenced above ever ran a deploy.
- The `ADMIN_*.md`/`.txt` files at the repo root are earlier design notes
  from when the admin panel was first built (frontend-talks-directly-to-
  Supabase vs the current backend-only architecture). Some of what they
  describe no longer matches the current code (e.g. they reference
  `NEXT_PUBLIC_SUPABASE_*` env vars that nothing reads today) - treat them as
  historical context, not current setup instructions.
