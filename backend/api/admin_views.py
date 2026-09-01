"""
Admin authentication endpoints for Flask backend.
All admin operations must go through these backend endpoints.
Frontend only stores the token in localStorage and sends it with requests.
"""

from flask import jsonify, request
from datetime import datetime, timedelta
import secrets
import uuid
from api.session_store import create_session, get_session, delete_session, verify_session, get_all_sessions
from app.supabase_client import get_supabase_client

# Default admin user (in production, query from Supabase admin_users table)
ADMIN_USERS = {
    'admin': {
        'password': 'changeme123',  # In production, HASH THIS with bcrypt
        'id': str(uuid.uuid4()),
        'username': 'admin'
    }
}


def generate_token():
    """Generate a secure token for the admin session"""
    return secrets.token_urlsafe(32)


def admin_login():
    """
    Admin login endpoint

    POST /api/admin/login/
    Body: { "username": "admin", "password": "changeme123" }

    Returns: { "id": "...", "username": "admin", "token": "..." }

    Checks credentials from Supabase database first, falls back to in-memory ADMIN_USERS
    """
    try:
        data = request.get_json(silent=True)
        print(f"DEBUG: Login request received: {data}")

        if not data:
            return jsonify({'error': 'Invalid JSON'}), 400

        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400

        admin_user = None
        admin_id = None

        # Try to get admin user from Supabase database first
        try:
            supabase = get_supabase_client()
            result = supabase.table('admin_users').select('*').eq('username', username).execute()
            if result.data and len(result.data) > 0:
                db_user = result.data[0]
                if db_user['password'] == password:
                    admin_user = db_user
                    admin_id = db_user['id']
                    print(f"DEBUG: User {username} authenticated from Supabase database")
        except Exception as db_error:
            print(f"DEBUG: Supabase lookup failed: {db_error}, falling back to in-memory")

        # Fall back to in-memory ADMIN_USERS if database lookup failed
        if not admin_user:
            admin_user = ADMIN_USERS.get(username)
            if admin_user and admin_user['password'] == password:
                admin_id = admin_user['id']
                print(f"DEBUG: User {username} authenticated from in-memory store")
            else:
                print(f"DEBUG: Invalid credentials for user: {username}")
                return jsonify({'error': 'Invalid credentials'}), 401

        # Generate token
        token = generate_token()

        # Store session using shared session store
        session_id = create_session(token, username, admin_id)

        return jsonify({
            'id': session_id,
            'username': username,
            'token': token
        }), 200

    except Exception as e:
        print(f"Admin login error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


def admin_logout():
    """
    Admin logout endpoint

    POST /api/admin/logout/
    Header: Authorization: Bearer <token>
    """
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing authorization header'}), 401

        token = auth_header[7:]  # Remove "Bearer " prefix

        if not delete_session(token):
            return jsonify({'error': 'Invalid token'}), 401

        return jsonify({'message': 'Logged out successfully'}), 200

    except Exception as e:
        print(f"Admin logout error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


def admin_verify():
    """
    Verify admin session token

    GET /api/admin/verify/
    Header: Authorization: Bearer <token>

    Returns: { "valid": true, "username": "admin", "id": "..." }
    """
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'valid': False}), 401

        token = auth_header[7:]  # Remove "Bearer " prefix

        if not verify_session(token):
            return jsonify({'valid': False}), 401

        session = get_session(token)
        if not session:
            return jsonify({'valid': False}), 401

        return jsonify({
            'valid': True,
            'username': session['username'],
            'id': session['id']
        }), 200

    except Exception as e:
        print(f"Admin verify error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


def admin_change_password():
    """
    Change admin password endpoint

    POST /api/admin/change-password/
    Header: Authorization: Bearer <token>
    Body: { "current_password": "old_pass", "new_password": "new_pass" }
    """
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing authorization header'}), 401

        token = auth_header[7:]  # Remove "Bearer " prefix

        session = get_session(token)
        if not session or not verify_session(token):
            return jsonify({'error': 'Unauthorized'}), 401
        data = request.get_json(silent=True)

        if not data:
            return jsonify({'error': 'Invalid JSON'}), 400

        current_password = data.get('current_password')
        new_password = data.get('new_password')

        if not current_password or not new_password:
            return jsonify({'error': 'Current and new password required'}), 400

        username = session['username']

        # Check the current password against Supabase first, falling back to
        # the in-memory store - mirrors admin_login()'s own priority. Without
        # this, changing the password directly in Supabase (which is the
        # whole point of storing it there in plaintext - so it can be read
        # and managed from the database) would make this endpoint reject the
        # correct current password, since it would only ever compare against
        # the stale in-memory default.
        verified = False
        try:
            supabase = get_supabase_client()
            result = supabase.table('admin_users').select('*').eq('username', username).execute()
            if result.data and result.data[0]['password'] == current_password:
                verified = True
        except Exception as db_error:
            print(f"DEBUG: Supabase lookup failed during password change: {db_error}")

        if not verified:
            admin_user = ADMIN_USERS.get(username)
            if admin_user and admin_user['password'] == current_password:
                verified = True

        if not verified:
            return jsonify({'error': 'Current password is incorrect'}), 401

        # Update both stores so the next login/change stays consistent
        # regardless of which one is consulted first.
        if username in ADMIN_USERS:
            ADMIN_USERS[username]['password'] = new_password

        try:
            supabase = get_supabase_client()
            supabase.table('admin_users').update({'password': new_password}).eq('username', username).execute()
            print(f"DEBUG: Password updated in Supabase for user: {username}")
        except Exception as db_error:
            print(f"WARNING: Failed to update password in Supabase: {db_error}")
            # Continue anyway since it was updated in memory (if it existed there)

        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        print(f"Change password error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


def debug_sessions():
    """
    DEBUG endpoint - shows all active sessions
    GET /api/admin/debug/sessions
    """
    return jsonify({
        'active_sessions': len(get_all_sessions()),
        'sessions': list(get_all_sessions().keys())[:5],  # Show first 5 tokens
        'admin_users': list(ADMIN_USERS.keys())
    }), 200


def verify_admin_token(token):
    """
    Utility function to verify admin token
    Use this in other views to check if request is from admin

    Returns: (is_valid, session_data) or (False, None)
    """
    if not token or not verify_session(token):
        return False, None

    session = get_session(token)
    if not session:
        return False, None

    return True, session
