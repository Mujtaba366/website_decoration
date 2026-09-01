"""
Site-wide settings: a single editable row (site name, contact info, etc.)
that the storefront reads publicly and the admin edits.
"""

from flask import jsonify, request
from api.admin_views import verify_admin_token
from app.supabase_client import get_supabase_client

SETTINGS_FIELDS = (
    'site_name', 'tagline', 'support_email', 'phone',
    'location', 'logo_url', 'instagram_handle', 'service_area_note',
    'hero_eyebrow', 'hero_heading', 'hero_subheading',
    'about_heading', 'about_subheading', 'about_story',
    'how_it_works_heading', 'how_it_works_subheading',
)


def get_settings():
    """
    GET /api/settings
    Public endpoint - read by the storefront header/footer for site name etc.
    """
    try:
        supabase = get_supabase_client()
        rows = supabase.table('site_settings').select('*').eq('id', 1).execute().data or []
        return jsonify(rows[0] if rows else {}), 200
    except Exception as e:
        print(f"Get settings error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def update_settings():
    """
    PUT /api/admin/settings
    Header: Authorization: Bearer <token>
    Body: any subset of SETTINGS_FIELDS
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing authorization header'}), 401

    token = auth_header[7:]
    is_valid, session = verify_admin_token(token)
    if not is_valid:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Invalid JSON'}), 400

        update_data = {field: data[field] for field in SETTINGS_FIELDS if field in data}
        if not update_data:
            return jsonify({'error': 'No valid fields provided'}), 400

        supabase = get_supabase_client()
        result = supabase.table('site_settings').update(update_data).eq('id', 1).execute()

        if result.data and len(result.data) > 0:
            return jsonify(result.data[0]), 200
        return jsonify({'error': 'Settings row not found'}), 404
    except Exception as e:
        print(f"Update settings error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
