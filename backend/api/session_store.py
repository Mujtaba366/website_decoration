"""
Shared session store for admin authentication
"""

from datetime import datetime, timedelta

# Shared dictionary for all admin sessions
ADMIN_SESSIONS = {}

def create_session(token, username, admin_id):
    """Create a new admin session"""
    session_id = str(__import__('uuid').uuid4())
    ADMIN_SESSIONS[token] = {
        'id': session_id,
        'username': username,
        'admin_id': admin_id,
        'created_at': datetime.now(),
        'expires_at': datetime.now() + timedelta(hours=24)
    }
    print(f"DEBUG: Created session for {username}, token: {token[:20]}...")
    print(f"DEBUG: Total sessions now: {len(ADMIN_SESSIONS)}")
    return session_id

def get_session(token):
    """Get a session by token"""
    return ADMIN_SESSIONS.get(token)

def delete_session(token):
    """Delete a session"""
    if token in ADMIN_SESSIONS:
        del ADMIN_SESSIONS[token]
        return True
    return False

def verify_session(token):
    """Verify a session is valid and not expired"""
    session = ADMIN_SESSIONS.get(token)
    if not session:
        return False

    if datetime.now() > session['expires_at']:
        del ADMIN_SESSIONS[token]
        return False

    return True

def get_all_sessions():
    """Get all active sessions"""
    return {k: v for k, v in ADMIN_SESSIONS.items() if datetime.now() <= v['expires_at']}
