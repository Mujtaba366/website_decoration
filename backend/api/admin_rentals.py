"""
Admin endpoints for rentals: bookings management + the global blocked-dates
calendar. One operator handles all deliveries, so a blocked date applies
across every rental product rather than per-item.
"""

from flask import jsonify, request
from api.admin_views import verify_admin_token
from app.supabase_client import get_supabase_client, SupabaseError


def _authorize():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header[7:]
    is_valid, session = verify_admin_token(token)
    return session if is_valid else None


def get_admin_bookings():
    """
    GET /api/admin/bookings
    Header: Authorization: Bearer <token>

    Returns all bookings with their linked product name, newest first.
    """
    if not _authorize():
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        supabase = get_supabase_client()
        bookings = supabase.table('bookings').select('*').execute().data or []
        products = supabase.table('products').select('id,name,slug').execute().data or []
        products_by_id = {p['id']: p for p in products}

        for booking in bookings:
            product = products_by_id.get(booking.get('product_id'))
            booking['product_name'] = product['name'] if product else 'Deleted product'

        bookings.sort(key=lambda b: b.get('created_at') or '', reverse=True)

        return jsonify({'bookings': bookings, 'total': len(bookings)}), 200
    except Exception as e:
        print(f"Get admin bookings error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def update_admin_booking(booking_id):
    """
    PUT /api/admin/bookings/<booking_id>
    Header: Authorization: Bearer <token>
    Body: any subset of { "status", "fulfillment_type", "extra_fee", "message" }

    Setting status to "cancelled" also releases the booking's blocked_dates
    row, so the date opens back up on the global calendar. Without this, a
    cancelled booking would keep permanently blocking its date for every
    rental product with no way to free it short of the separate "unblock"
    action, which admins cancelling a booking would have no reason to know
    they also need to do.
    """
    if not _authorize():
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Invalid JSON'}), 400

        update_data = {}
        for field in ('status', 'fulfillment_type', 'extra_fee', 'message', 'delivery_option_id'):
            if field in data:
                update_data[field] = data[field]

        supabase = get_supabase_client()
        result = supabase.table('bookings').update(update_data).eq('id', booking_id).execute()

        if result.data and len(result.data) > 0:
            if update_data.get('status') == 'cancelled':
                supabase.table('blocked_dates').delete().eq('booking_id', booking_id).execute()
            return jsonify(result.data[0]), 200
        return jsonify({'error': 'Booking not found'}), 404
    except Exception as e:
        print(f"Update admin booking error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def delete_admin_booking(booking_id):
    """
    DELETE /api/admin/bookings/<booking_id>
    Header: Authorization: Bearer <token>

    Permanently removes a booking (e.g. a duplicate or test entry), unlike
    "cancel" which keeps the record for history. Also releases its
    blocked_dates row, same as cancelling.
    """
    if not _authorize():
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        supabase = get_supabase_client()
        supabase.table('blocked_dates').delete().eq('booking_id', booking_id).execute()
        supabase.table('bookings').delete().eq('id', booking_id).execute()
        return jsonify({'message': 'Booking deleted'}), 200
    except Exception as e:
        print(f"Delete admin booking error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def get_blocked_dates():
    """
    GET /api/blocked-dates
    Public endpoint - the storefront needs this to grey out unavailable
    dates on the booking calendar for every rental product.
    """
    try:
        supabase = get_supabase_client()
        dates = supabase.table('blocked_dates').select('*').execute().data or []
        return jsonify(dates), 200
    except Exception as e:
        print(f"Get blocked dates error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def create_blocked_date():
    """
    POST /api/admin/blocked-dates
    Header: Authorization: Bearer <token>
    Body: { "date": "2026-09-14", "reason": "Day off" }

    Manually blocks a date across all rental products (e.g. a holiday or a
    day the operator is unavailable). Dates already blocked by a booking
    should be removed via cancelling/deleting that booking instead.
    """
    if not _authorize():
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        data = request.get_json(silent=True)
        if not data or not data.get('date'):
            return jsonify({'error': 'date is required'}), 400

        supabase = get_supabase_client()
        result = supabase.table('blocked_dates').insert({
            'date': data['date'],
            'reason': data.get('reason') or 'Blocked by admin',
        }).execute()

        if result.data and len(result.data) > 0:
            return jsonify(result.data[0]), 201
        return jsonify({'error': 'Failed to block date'}), 400
    except SupabaseError as e:
        if e.status_code == 409:
            return jsonify({'error': 'That date is already blocked'}), 409
        print(f"Create blocked date error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
    except Exception as e:
        print(f"Create blocked date error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def delete_blocked_date(blocked_date_id):
    """
    DELETE /api/admin/blocked-dates/<blocked_date_id>
    Header: Authorization: Bearer <token>

    Unblocks a date. If it was tied to a booking, this only clears the
    calendar block - it does not cancel the booking itself.
    """
    if not _authorize():
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        supabase = get_supabase_client()
        supabase.table('blocked_dates').delete().eq('id', blocked_date_id).execute()
        return jsonify({'message': 'Date unblocked'}), 200
    except Exception as e:
        print(f"Delete blocked date error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
