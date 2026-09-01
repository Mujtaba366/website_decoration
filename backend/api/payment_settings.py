"""
Payment settings: bank account details (for manual bank transfer) and
Stripe's non-secret config (publishable key, currency, which methods are
enabled, success/cancel URLs).

Unlike every other table in this project, payment_settings has RLS enabled
with NO anon/authenticated policies at all - it's unreachable with the
anon key, by design (see the create_payment_settings_table migration).
Every function here goes through get_supabase_admin_client() (the
service-role key, which bypasses RLS) instead of get_supabase_client().

The Stripe SECRET key is never read from or written to this table, or any
table - it lives in the STRIPE_SECRET_KEY backend environment variable
only (see stripe_payments.py and backend/README.md). PUBLIC_FIELDS below
is the complete list of what a customer-facing page is allowed to see;
double-check any future field addition belongs there before adding it.
"""

from flask import jsonify, request
from api.admin_views import verify_admin_token
from app.supabase_client import get_supabase_admin_client

# Fields safe to expose to anyone - the bank account number is deliberately
# included, since customers need to see it to pay by bank transfer.
PUBLIC_FIELDS = (
    'bank_account_number', 'bank_account_name', 'bank_transfer_enabled',
    'stripe_enabled', 'stripe_publishable_key', 'currency',
)

# Everything an admin can edit. Deliberately does NOT include a secret key
# field - there isn't one on this table at all.
ADMIN_EDITABLE_FIELDS = PUBLIC_FIELDS + ('stripe_success_url', 'stripe_cancel_url')


def _authorize():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header[7:]
    is_valid, session = verify_admin_token(token)
    return session if is_valid else None


def get_payment_config():
    """
    GET /api/payment-config
    Public endpoint - the cart/checkout page needs this to know which
    payment methods to offer and what bank account to show. Returns only
    PUBLIC_FIELDS, not the full admin row.
    """
    try:
        supabase = get_supabase_admin_client()
        rows = supabase.table('payment_settings').select('*').eq('id', 1).execute().data or []
        row = rows[0] if rows else {}
        return jsonify({field: row.get(field) for field in PUBLIC_FIELDS}), 200
    except Exception as e:
        print(f"Get payment config error: {e}")
        # Fails closed: if the settings can't be read, report every payment
        # method as unavailable rather than erroring the whole checkout page.
        return jsonify({field: (False if field.endswith('_enabled') else None) for field in PUBLIC_FIELDS}), 200


def get_admin_payment_settings():
    """
    GET /api/admin/payment-settings
    Header: Authorization: Bearer <token>
    Returns the full row for the admin settings form.
    """
    if not _authorize():
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        supabase = get_supabase_admin_client()
        rows = supabase.table('payment_settings').select('*').eq('id', 1).execute().data or []
        return jsonify(rows[0] if rows else {}), 200
    except Exception as e:
        print(f"Get admin payment settings error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def update_payment_settings():
    """
    PUT /api/admin/payment-settings
    Header: Authorization: Bearer <token>
    Body: any subset of ADMIN_EDITABLE_FIELDS
    """
    if not _authorize():
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Invalid JSON'}), 400

        update_data = {field: data[field] for field in ADMIN_EDITABLE_FIELDS if field in data}
        if not update_data:
            return jsonify({'error': 'No valid fields provided'}), 400

        supabase = get_supabase_admin_client()
        result = supabase.table('payment_settings').update(update_data).eq('id', 1).execute()

        if result.data and len(result.data) > 0:
            return jsonify(result.data[0]), 200
        return jsonify({'error': 'Settings row not found'}), 404
    except Exception as e:
        print(f"Update payment settings error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
