# Backend

Flask API for the Bloom & Vow storefront and admin panel. Talks to Supabase (via a
small hand-rolled REST wrapper in `app/supabase_client.py`, not the official
`supabase-py` client) for all data.

## Running locally

```
cd backend
python web.py
```

Needs `backend/.env` (untracked, never committed - see below) to be present with
real values. Runs on `http://127.0.0.1:5000` by default.

## Environment variables

`backend/.env` is not committed to git (see `.gitignore`) and there is no
`.env.example` in this repo - real credentials for the values below live only in
that local, gitignored file. This section is the reference for what it needs.

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | yes | Your Supabase project's API URL, e.g. `https://xxxxx.supabase.co`. Find it under Project Settings → API. |
| `SUPABASE_KEY` | not read by the backend anymore | Supabase **anon/public** key. Used to be what the backend authenticated every request with (back when every table's RLS policy was wide open and trusted this key). As of the RLS lockdown, `get_supabase_client()` no longer reads this - the backend uses `SUPABASE_SERVICE_ROLE_KEY` for everything, and RLS now actually restricts what this key can do (see `SECURITY_DEBT.md` item 1). Still worth keeping around: it's the credential a hypothetical future direct-frontend-to-Supabase read would use, and it's genuinely safe to expose (unlike the service-role key) since RLS now limits it to SELECT-only on the handful of public tables (`products`, `blocked_dates`, `delivery_options`, `site_settings`). |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Read by `get_supabase_client()` (and `get_supabase_admin_client()`, now identical) in `app/supabase_client.py` - the backend's only credential for every table, following the RLS lockdown. **This key bypasses RLS entirely - never commit it, never put it in a client-side/frontend env var, never log it.** Flask does its own authorization (`verify_admin_token` on admin routes) independent of RLS, which is why this is safe: RLS's job shifted from "gate the backend's own operations" to "stop someone from bypassing Flask and hitting Supabase directly." |
| `FLASK_ENV` | no | `development` or `production`. Informational; not read directly by `web.py`. |
| `FLASK_DEBUG` | no | `True`/`False`. Informational; `web.py` hardcodes `debug=True` in `app.run(...)` regardless - change that line directly for a production run rather than relying on this variable. |
| `FLASK_APP` | no | Conventional Flask CLI variable (`web.py`). Not needed if you run `python web.py` directly. |
| `SECRET_KEY` | no | Falls back to a hardcoded dev value if unset. Set a real random value before ever deploying anywhere reachable. |
| `PORT` | no | Defaults to `5000`. |
| `CORS_ORIGINS` | yes for any non-default setup | Comma-separated list of frontend origins allowed to call this API, e.g. `http://localhost:3000,https://yourdomain.com`. Defaults to `http://localhost:3000` if unset - **on a real deploy, this must be set to the real deployed frontend URL, not left at the local default** (a real incident: leaving this at `http://localhost:3000` in production makes every browser request silently fail - the OPTIONS preflight still returns 200, but with no CORS headers at all, so it looks fine in server access logs while the browser refuses to send the real request). Each origin is trimmed and has any trailing slash stripped before matching, so `https://yourdomain.com/` and `https://yourdomain.com` are treated the same - but the scheme (`http` vs `https`) and exact host still must match the browser's `Origin` header precisely. Also used as the fallback base for Stripe's success/cancel URLs if the admin hasn't set explicit ones in Payment Settings - see below. |
| `STRIPE_SECRET_KEY` | no - card payments simply stay disabled without it | **Real Stripe credential. Backend env var only - never store this in the database or expose it through the admin panel, under any circumstances.** Must start with `sk_test_...` (test mode) or `sk_live_...` (live mode) - `is_stripe_configured()` in `api/stripe_payments.py` checks for that prefix specifically, so a placeholder value like the one this repo ships with (`your-stripe-secret-key`) is correctly treated as "not configured," not silently sent to Stripe's API. Get it from the Stripe Dashboard → Developers → API keys. Card payments only actually happen at checkout once BOTH this env var is set to a real key AND "Offer card payment at checkout" is turned on in Admin → Settings → Payment Settings - the admin toggle alone does nothing without this. |
| `STRIPE_WEBHOOK_SECRET` | no - webhook processing simply stays disabled without it | Verifies that `POST /api/webhooks/stripe` requests genuinely came from Stripe (HMAC signature check, implemented by hand in `api/stripe_payments.py` - no `stripe` SDK). Without this set, the webhook endpoint acknowledges requests but does nothing - it deliberately never marks an order paid from an unverified request, since that would let anyone fake a successful payment. Get it from the Stripe Dashboard → Developers → Webhooks, after registering `https://your-backend-domain/api/webhooks/stripe` there and subscribing to the `checkout.session.completed` event. |
| `STRIPE_PUBLIC_KEY` | no (unused - legacy name) | Not read by any code. The Stripe **publishable** key (safe to expose publicly, unlike the secret key) is set through Admin → Settings → Payment Settings instead, stored in the `payment_settings` table, and served to the storefront via the public `GET /api/payment-config` endpoint. This env var predates that and can be ignored/removed. |
| `MAIL_SERVER` / `MAIL_PORT` / `MAIL_USE_TLS` / `MAIL_USERNAME` / `MAIL_PASSWORD` | no (unused) | Reserved for future email sending - no code reads these yet. |

### Payment configuration - what lives where

This project deliberately splits payment configuration across three places, by sensitivity:

1. **Backend env vars only** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) - real secrets. Never in the database, never admin-editable, never sent to the frontend.
2. **Admin-only database table** (`payment_settings`, edited via Admin → Settings → Payment Settings) - the bank account number and Stripe's non-secret config (publishable key, currency, enabled toggles, success/cancel URLs). This table has no RLS policy for the anon key at all - only backend code using `SUPABASE_SERVICE_ROLE_KEY` can read or write it directly. Its data still reaches customers, but only through the narrow `GET /api/payment-config` endpoint, which returns just the fields checkout actually needs (including the bank account number, since customers must see it to pay by transfer) - not a blanket dump of the row.
3. **Public site settings** (`site_settings`, everything else in Admin → Settings) - fully open to the anon key, same as every other non-payment field on the site.

If you're setting this up for a real Stripe account: paste `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` here, then paste the publishable key and turn on the toggle in the admin panel. Until both are done, the storefront correctly shows card payment as unavailable rather than erroring.

## Tests

```
venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py" -v
```

(from the `backend/` directory, or `-s backend/tests` from the repo root). Uses a
fake in-memory Supabase client (`tests/fake_supabase.py`) - no real credentials or
network access needed to run the suite.
