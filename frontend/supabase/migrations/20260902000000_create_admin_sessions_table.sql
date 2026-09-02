-- Durable admin session storage, replacing the in-process ADMIN_SESSIONS
-- dict (backend/api/session_store.py), which broke under gunicorn's
-- multiple worker processes on Render: a session created on one worker was
-- invisible to the others, causing login to succeed and the very next
-- request to 401. This table survives restarts, deploys, and any number
-- of workers, since they all read/write the same Supabase row.
--
-- No foreign key on admin_id: the backend has a legacy in-memory
-- ADMIN_USERS fallback (see admin_views.py) whose synthetic id isn't a
-- real admin_users row, so a strict FK would break that path.
CREATE TABLE admin_sessions (
  token text PRIMARY KEY,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id text,
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- A live session token is password-equivalent - same treatment as
-- payment_settings: RLS enabled, no anon/authenticated policy at all.
-- Only the backend's service-role key can read or write this table.
-- Verified with the anon key after this migration: SELECT returns [],
-- INSERT is rejected with a 401 RLS violation.
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
