"""
Shared session store for admin authentication.

Backed by the admin_sessions Supabase table, not an in-process dict - a
plain module-level ADMIN_SESSIONS = {} broke as soon as this app ran under
more than one process (gunicorn's multiple workers on Render): a session
created by whichever worker handled the login request was invisible to
every other worker, so the very next admin request would 401 even though
login had just succeeded. This table is shared external state, so every
worker (and every restart, deploy, or cold start) sees the same sessions.

The five function signatures below are unchanged from the old in-memory
implementation on purpose - nothing else in the codebase (admin_views.py,
admin_rentals.py, etc.) needed to change as a result of this rewrite.
"""

from datetime import datetime, timedelta, timezone
import uuid
from app.supabase_client import get_supabase_client

# 24 hours - unchanged from the original in-memory implementation. This is
# an admin-only tool for one business owner, not a consumer app with a
# large attack surface, so a full-day session that survives restarts and
# deploys (which it now actually will, unlike before) is a reasonable
# trade-off between convenience and exposure if a token were ever stolen.
SESSION_LIFETIME = timedelta(hours=24)


def _now():
    return datetime.now(timezone.utc)


def _parse(ts: str) -> datetime:
    # PostgREST returns timestamptz values as ISO 8601 with a numeric
    # offset (e.g. "2026-09-02T10:00:00+00:00"), which fromisoformat
    # handles natively - no strptime format string to keep in sync.
    return datetime.fromisoformat(ts)


def _row_to_session(row: dict) -> dict:
    return {
        'id': row['session_id'],
        'username': row['username'],
        'admin_id': row['admin_id'],
        'created_at': _parse(row['created_at']),
        'expires_at': _parse(row['expires_at']),
    }


def _delete_expired():
    """Best-effort cleanup so expired rows don't accumulate forever. Runs
    opportunistically on every new login rather than needing a cron job -
    this app has no scheduled-task infrastructure, and login is exactly
    the moment a bit of extra latency for housekeeping is least noticeable.
    Deliberately swallows errors: a failed cleanup must never block an
    actual login."""
    try:
        supabase = get_supabase_client()
        rows = supabase.table('admin_sessions').select('token,expires_at').execute().data or []
        now = _now()
        for row in rows:
            if _parse(row['expires_at']) < now:
                supabase.table('admin_sessions').delete().eq('token', row['token']).execute()
    except Exception as e:
        print(f"WARNING: Failed to clean up expired admin sessions: {e}")


def create_session(token, username, admin_id):
    """Create a new admin session"""
    session_id = str(uuid.uuid4())
    _delete_expired()

    now = _now()
    supabase = get_supabase_client()
    supabase.table('admin_sessions').insert({
        'token': token,
        'session_id': session_id,
        'username': username,
        'admin_id': admin_id,
        'created_at': now.isoformat(),
        'expires_at': (now + SESSION_LIFETIME).isoformat(),
    }).execute()

    print(f"DEBUG: Created session for {username}, token: {token[:20]}...")
    return session_id


def get_session(token):
    """Get a session by token. Returns None on a genuinely missing session
    AND on a Supabase error - callers can't tell the two apart, which is
    intentional: either way, the safe behavior is to treat the caller as
    unauthenticated (fail closed), never to treat an infrastructure error
    as "session valid" (fail open) or to raise and 500 the request."""
    try:
        supabase = get_supabase_client()
        rows = supabase.table('admin_sessions').select('*').eq('token', token).execute().data or []
    except Exception as e:
        print(f"WARNING: Failed to look up admin session (treating as invalid): {e}")
        return None

    if not rows:
        return None
    return _row_to_session(rows[0])


def delete_session(token):
    """Delete a session. Returns False (not an error) if it didn't exist,
    or if Supabase couldn't be reached - a failed logout attempt should
    never surface as a 500 to the admin clicking the button."""
    session = get_session(token)
    if not session:
        return False
    try:
        supabase = get_supabase_client()
        supabase.table('admin_sessions').delete().eq('token', token).execute()
        return True
    except Exception as e:
        print(f"WARNING: Failed to delete admin session: {e}")
        return False


def verify_session(token):
    """Verify a session is valid and not expired. Fails closed (returns
    False) on a missing session, an expired one, AND on a Supabase error -
    see get_session()'s docstring for why an infrastructure failure must
    never be treated as a valid session. A transient failure here means
    the admin has to log in again, not that they're locked out permanently
    - the very next attempt tries Supabase fresh."""
    session = get_session(token)
    if not session:
        return False

    if _now() > session['expires_at']:
        delete_session(token)
        return False

    return True


def get_all_sessions():
    """Get all active (non-expired) sessions, keyed by token - used only by
    the admin-gated session-count endpoint. Returns an empty dict rather
    than raising if Supabase is unreachable, consistent with every other
    function here failing closed instead of erroring."""
    try:
        supabase = get_supabase_client()
        rows = supabase.table('admin_sessions').select('*').execute().data or []
    except Exception as e:
        print(f"WARNING: Failed to list admin sessions: {e}")
        return {}

    now = _now()
    return {
        row['token']: _row_to_session(row)
        for row in rows
        if _parse(row['expires_at']) >= now
    }
