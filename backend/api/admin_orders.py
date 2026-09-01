"""
Admin endpoint for shop orders (the admin Orders page was previously
static and never fetched real data).
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


def get_admin_orders():
    """
    GET /api/admin/orders
    Header: Authorization: Bearer <token>

    Returns all shop orders, newest first.
    """
    if not _authorize():
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        supabase = get_supabase_client()
        orders = supabase.table('orders').select('*').execute().data or []
        orders.sort(key=lambda o: o.get('created_at') or '', reverse=True)
        return jsonify({'orders': orders, 'total': len(orders)}), 200
    except Exception as e:
        print(f"Get admin orders error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def update_admin_order(order_id):
    """
    PUT /api/admin/orders/<order_id>
    Header: Authorization: Bearer <token>
    Body: any subset of { "status" }
    """
    if not _authorize():
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Invalid JSON'}), 400

        update_data = {}
        for field in ('status',):
            if field in data:
                update_data[field] = data[field]

        supabase = get_supabase_client()
        result = supabase.table('orders').update(update_data).eq('id', order_id).execute()

        if result.data and len(result.data) > 0:
            return jsonify(result.data[0]), 200
        return jsonify({'error': 'Order not found'}), 404
    except Exception as e:
        print(f"Update admin order error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def delete_admin_order(order_id):
    """
    DELETE /api/admin/orders/<order_id>
    Header: Authorization: Bearer <token>

    Permanently removes an order (e.g. a duplicate or test entry). For a
    real customer order, prefer setting status to "cancelled" instead, which
    keeps the record - this is for removing entries entirely.
    """
    if not _authorize():
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        supabase = get_supabase_client()
        supabase.table('orders').delete().eq('id', order_id).execute()
        return jsonify({'message': 'Order deleted'}), 200
    except Exception as e:
        print(f"Delete admin order error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
