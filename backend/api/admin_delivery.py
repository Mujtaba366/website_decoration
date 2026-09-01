"""
Delivery options: admin-configurable list of fulfillment choices shown to
customers on the rental booking form (replaces the old hardcoded
"setup"/"pickup" radio buttons).
"""

from flask import jsonify, request
from api.admin_views import verify_admin_token
from app.supabase_client import get_supabase_client


def _authorize():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header[7:]
    is_valid, session = verify_admin_token(token)
    return session if is_valid else None


def get_delivery_options():
    """
    GET /api/delivery-options
    Public endpoint - active options only, in display order.
    """
    try:
        supabase = get_supabase_client()
        options = supabase.table('delivery_options').select('*').execute().data or []
        options = [o for o in options if o.get('active')]
        options.sort(key=lambda o: o.get('sort_order') or 0)
        return jsonify(options), 200
    except Exception as e:
        print(f"Get delivery options error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def get_admin_delivery_options():
    """
    GET /api/admin/delivery-options
    Header: Authorization: Bearer <token>

    Returns every option (including inactive/soft-deleted ones) for management.
    """
    if not _authorize():
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        supabase = get_supabase_client()
        options = supabase.table('delivery_options').select('*').execute().data or []
        options.sort(key=lambda o: o.get('sort_order') or 0)
        return jsonify(options), 200
    except Exception as e:
        print(f"Get admin delivery options error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def create_delivery_option():
    """
    POST /api/admin/delivery-options
    Header: Authorization: Bearer <token>
    Body: { "label": "...", "description": "...", "fee": 0, "sort_order": 2 }
    """
    if not _authorize():
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        data = request.get_json(silent=True)
        if not data or not (data.get('label') or '').strip():
            return jsonify({'error': 'label is required'}), 400

        supabase = get_supabase_client()
        option = {
            'label': data['label'].strip(),
            'description': data.get('description') or None,
            'fee': data.get('fee', 0),
            'is_default': bool(data.get('is_default', False)),
            'active': True,
            'sort_order': data.get('sort_order', 0),
        }
        result = supabase.table('delivery_options').insert(option).execute()

        if result.data and len(result.data) > 0:
            return jsonify(result.data[0]), 201
        return jsonify({'error': 'Failed to create delivery option'}), 400
    except Exception as e:
        print(f"Create delivery option error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def update_delivery_option(option_id):
    """
    PUT /api/admin/delivery-options/<option_id>
    Header: Authorization: Bearer <token>
    Body: any subset of { "label", "description", "fee", "is_default", "active", "sort_order" }

    Setting "active": false is how the admin removes an option from the
    customer-facing form without breaking past bookings that reference it.
    """
    if not _authorize():
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Invalid JSON'}), 400

        update_data = {}
        for field in ('label', 'description', 'fee', 'is_default', 'active', 'sort_order'):
            if field in data:
                update_data[field] = data[field]

        supabase = get_supabase_client()
        result = supabase.table('delivery_options').update(update_data).eq('id', option_id).execute()

        if result.data and len(result.data) > 0:
            return jsonify(result.data[0]), 200
        return jsonify({'error': 'Delivery option not found'}), 404
    except Exception as e:
        print(f"Update delivery option error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
