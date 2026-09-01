"""
Stripe integration via raw REST calls (no `stripe` PyPI package - keeps
with "no new installs" and the pattern already used for Supabase: a small
hand-rolled wrapper around `requests` instead of an official SDK).

No real Stripe credentials exist for this project. Everything here is
built against env vars that may not be set, and is guarded so the site
behaves correctly (payments simply unavailable, no crashes) when they
aren't. STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET live in backend env
vars only - never in the database, never in the admin panel. See
backend/README.md for what to paste where once real keys exist.
"""

import os
import hmac
import hashlib
import time
import requests
from flask import jsonify, request
from app.supabase_client import get_supabase_client, get_supabase_admin_client

STRIPE_API_BASE = 'https://api.stripe.com/v1'
REQUEST_TIMEOUT = 10
# How much clock drift to tolerate on a webhook's timestamp before treating
# it as stale (matches Stripe's own default tolerance).
WEBHOOK_TOLERANCE_SECONDS = 300


def is_stripe_configured():
    # Checks the shape, not just presence - backend/.env ships with a
    # 'your-stripe-secret-key'-style placeholder for this var (documented in
    # backend/README.md), which would otherwise read as "configured" and
    # let a real API call go out with a bogus key. Real Stripe secret keys
    # always start with 'sk_' (test or live mode).
    key = os.getenv('STRIPE_SECRET_KEY', '')
    return key.startswith('sk_')


def _default_url(path):
    """Falls back to the configured frontend origin (CORS_ORIGINS' first
    entry) when the admin hasn't set an explicit success/cancel URL yet -
    there's no reliable way to guess the frontend's own URL otherwise,
    since this is the backend's own host, not the frontend's."""
    origin = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')[0].strip()
    return f"{origin.rstrip('/')}{path}"


def create_checkout_session():
    """
    POST /api/checkout/stripe-session
    Body: { "order_id": "..." }

    Creates a Stripe Checkout Session for an existing order and returns its
    URL for the frontend to redirect to. Returns 503 (not a crash) if
    Stripe isn't configured.
    """
    if not is_stripe_configured():
        return jsonify({'error': 'Card payments are not available right now.'}), 503

    data = request.get_json(silent=True)
    order_id = data.get('order_id') if data else None
    if not order_id:
        return jsonify({'error': 'order_id is required'}), 400

    try:
        supabase = get_supabase_client()
        orders = supabase.table('orders').select('*').eq('id', order_id).execute().data or []
        if not orders:
            return jsonify({'error': 'Order not found'}), 404
        order = orders[0]

        admin_client = get_supabase_admin_client()
        settings_rows = admin_client.table('payment_settings').select('*').eq('id', 1).execute().data or []
        settings = settings_rows[0] if settings_rows else {}

        if not settings.get('stripe_enabled'):
            return jsonify({'error': 'Card payments are not enabled.'}), 503

        currency = (settings.get('currency') or 'NZD').lower()
        success_url = settings.get('stripe_success_url') or _default_url('/cart?payment=success')
        cancel_url = settings.get('stripe_cancel_url') or _default_url('/cart?payment=cancelled')

        amount_cents = round(float(order['total']) * 100)

        form = {
            'mode': 'payment',
            'success_url': success_url,
            'cancel_url': cancel_url,
            'line_items[0][quantity]': '1',
            'line_items[0][price_data][currency]': currency,
            'line_items[0][price_data][unit_amount]': str(amount_cents),
            'line_items[0][price_data][product_data][name]': f"Order #{order_id}",
            'metadata[order_id]': str(order_id),
        }

        response = requests.post(
            f'{STRIPE_API_BASE}/checkout/sessions',
            data=form,
            auth=(os.getenv('STRIPE_SECRET_KEY'), ''),
            timeout=REQUEST_TIMEOUT,
        )

        if response.status_code >= 400:
            print(f"Stripe checkout session error: {response.status_code} {response.text}")
            return jsonify({'error': 'Could not start the card payment. Please try another payment method.'}), 502

        session = response.json()
        return jsonify({'url': session['url']}), 201

    except requests.exceptions.RequestException as e:
        print(f"Stripe request failed: {e}")
        return jsonify({'error': 'Could not reach the payment provider. Please try again.'}), 503
    except Exception as e:
        print(f"Create checkout session error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


def _verify_webhook_signature(payload: bytes, sig_header: str, secret: str) -> bool:
    """Implements Stripe's documented webhook signature scheme by hand
    (HMAC-SHA256 over "{timestamp}.{payload}"), so no SDK is needed just to
    verify a webhook. See https://stripe.com/docs/webhooks#verify-manually"""
    try:
        pairs = dict(part.split('=', 1) for part in sig_header.split(',') if '=' in part)
        timestamp = pairs.get('t')
        signature = pairs.get('v1')
        if not timestamp or not signature:
            return False

        if abs(time.time() - int(timestamp)) > WEBHOOK_TOLERANCE_SECONDS:
            return False

        signed_payload = f'{timestamp}.'.encode() + payload
        expected = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)
    except (ValueError, AttributeError):
        return False


def stripe_webhook():
    """
    POST /api/webhooks/stripe
    Stripe calls this directly - no admin auth is possible here, so the
    webhook secret is the only thing standing between this endpoint and
    anyone who wants to fake a "payment succeeded" event to mark an order
    paid for free. Without STRIPE_WEBHOOK_SECRET configured, this endpoint
    deliberately does nothing but acknowledge receipt - it does NOT fall
    back to trusting unverified events, since that would be a real way to
    get free orders. Set STRIPE_WEBHOOK_SECRET once Stripe is live to
    actually enable order status updates from this endpoint.
    """
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    if not webhook_secret:
        print("Stripe webhook received but STRIPE_WEBHOOK_SECRET is not set - ignoring (see stripe_payments.py)")
        return jsonify({'received': True}), 200

    sig_header = request.headers.get('Stripe-Signature', '')
    payload = request.get_data()

    if not _verify_webhook_signature(payload, sig_header, webhook_secret):
        return jsonify({'error': 'Invalid signature'}), 400

    event = request.get_json(silent=True) or {}
    if event.get('type') == 'checkout.session.completed':
        session = event.get('data', {}).get('object', {})
        order_id = session.get('metadata', {}).get('order_id')
        if order_id:
            try:
                supabase = get_supabase_client()
                supabase.table('orders').update({'status': 'paid'}).eq('id', order_id).execute()
            except Exception as e:
                print(f"Failed to mark order {order_id} paid from webhook: {e}")

    return jsonify({'received': True}), 200
