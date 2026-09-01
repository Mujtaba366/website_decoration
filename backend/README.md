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
| `SUPABASE_KEY` | yes | Supabase **anon/public** key. This is what the backend authenticates every request with - see `SECURITY_DEBT.md` for why that matters (every table's RLS policy trusts this key). |
| `SUPABASE_SERVICE_ROLE_KEY` | no (currently unused) | Present in `.env` for future use but not read by any code today - `get_supabase_client()` only reads `SUPABASE_KEY`. **This key bypasses RLS entirely - never commit it, never put it in a client-side/frontend env var, never log it.** |
| `FLASK_ENV` | no | `development` or `production`. Informational; not read directly by `web.py`. |
| `FLASK_DEBUG` | no | `True`/`False`. Informational; `web.py` hardcodes `debug=True` in `app.run(...)` regardless - change that line directly for a production run rather than relying on this variable. |
| `FLASK_APP` | no | Conventional Flask CLI variable (`web.py`). Not needed if you run `python web.py` directly. |
| `SECRET_KEY` | no | Falls back to a hardcoded dev value if unset. Set a real random value before ever deploying anywhere reachable. |
| `PORT` | no | Defaults to `5000`. |
| `CORS_ORIGINS` | yes for any non-default setup | Comma-separated list of frontend origins allowed to call this API, e.g. `http://localhost:3000,https://yourdomain.com`. Defaults to `http://localhost:3000` if unset. |
| `STRIPE_PUBLIC_KEY` / `STRIPE_SECRET_KEY` | no (unused) | Reserved for future payment integration - no code reads these yet. |
| `MAIL_SERVER` / `MAIL_PORT` / `MAIL_USE_TLS` / `MAIL_USERNAME` / `MAIL_PASSWORD` | no (unused) | Reserved for future email sending - no code reads these yet. |

## Tests

```
venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py" -v
```

(from the `backend/` directory, or `-s backend/tests` from the repo root). Uses a
fake in-memory Supabase client (`tests/fake_supabase.py`) - no real credentials or
network access needed to run the suite.
