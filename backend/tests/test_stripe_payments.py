"""
Stripe integration, built against env vars that may not exist and no real
credentials. Covers the guard behavior (unconfigured -> 503, never a
crash), the checkout session request shape (mocking the actual HTTPS call
to Stripe - no network access needed), and webhook signature verification
implemented by hand (no `stripe` SDK).

End-to-end payment testing against the real Stripe API is blocked pending
real credentials - see OVERNIGHT_NOTES.md.
"""

import hmac
import hashlib
import time
import json
from unittest.mock import patch
from base import ApiTestCase
from api.stripe_payments import is_stripe_configured, _verify_webhook_signature


class StripeConfiguredCheckTests(ApiTestCase):
    def test_missing_key_is_not_configured(self):
        with patch.dict('os.environ', {}, clear=False):
            import os
            os.environ.pop('STRIPE_SECRET_KEY', None)
            self.assertFalse(is_stripe_configured())

    def test_placeholder_value_is_not_configured(self):
        """Regression guard: backend/.env ships with a
        'your-stripe-secret-key'-style placeholder, which must not be
        mistaken for a real key just because the env var is set."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'your-stripe-secret-key'}):
            self.assertFalse(is_stripe_configured())

    def test_a_real_looking_key_is_configured(self):
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'sk_test_abc123'}):
            self.assertTrue(is_stripe_configured())


class CreateCheckoutSessionTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.fake_db.store['orders'] = [{'id': 'order-1', 'total': 150.00, 'status': 'pending'}]
        self.fake_db.store['payment_settings'] = [{'id': 1, 'stripe_enabled': True, 'currency': 'NZD'}]

    def test_unconfigured_stripe_returns_503_not_a_crash(self):
        with patch.dict('os.environ', {}, clear=False):
            import os
            os.environ.pop('STRIPE_SECRET_KEY', None)
            res = self.client.post('/api/checkout/stripe-session', json={'order_id': 'order-1'})
            self.assertEqual(res.status_code, 503)

    def test_missing_order_id_returns_400(self):
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'sk_test_abc123'}):
            res = self.client.post('/api/checkout/stripe-session', json={})
            self.assertEqual(res.status_code, 400)

    def test_nonexistent_order_returns_404(self):
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'sk_test_abc123'}):
            res = self.client.post('/api/checkout/stripe-session', json={'order_id': 'does-not-exist'})
            self.assertEqual(res.status_code, 404)

    def test_stripe_disabled_in_settings_returns_503_even_with_a_configured_key(self):
        self.fake_db.store['payment_settings'] = [{'id': 1, 'stripe_enabled': False, 'currency': 'NZD'}]
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'sk_test_abc123'}):
            res = self.client.post('/api/checkout/stripe-session', json={'order_id': 'order-1'})
            self.assertEqual(res.status_code, 503)

    def test_successful_session_creation_returns_a_url(self):
        """Mocks the actual HTTPS call to Stripe - no network access, no
        real credentials, but confirms the request is built and the
        response is parsed correctly."""
        class FakeResponse:
            status_code = 200
            def json(self):
                return {'url': 'https://checkout.stripe.com/c/pay/cs_test_abc'}

        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'sk_test_abc123'}):
            with patch('api.stripe_payments.requests.post', return_value=FakeResponse()) as mock_post:
                res = self.client.post('/api/checkout/stripe-session', json={'order_id': 'order-1'})
                self.assertEqual(res.status_code, 201, res.get_json())
                self.assertEqual(res.get_json()['url'], 'https://checkout.stripe.com/c/pay/cs_test_abc')

                # Confirm the amount was converted to cents correctly and
                # the order id was attached as metadata for the webhook.
                _, kwargs = mock_post.call_args
                form = kwargs['data']
                self.assertEqual(form['line_items[0][price_data][unit_amount]'], '15000')
                self.assertEqual(form['metadata[order_id]'], 'order-1')

    def test_stripe_error_response_is_reported_not_crashed(self):
        class FakeResponse:
            status_code = 401
            text = 'Invalid API Key provided'

        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'sk_test_abc123'}):
            with patch('api.stripe_payments.requests.post', return_value=FakeResponse()):
                res = self.client.post('/api/checkout/stripe-session', json={'order_id': 'order-1'})
                self.assertEqual(res.status_code, 502)


class WebhookSignatureVerificationTests(ApiTestCase):
    """Stripe's own scheme, implemented by hand - see
    https://stripe.com/docs/webhooks#verify-manually - tested directly
    since it's the one piece of this integration that's genuinely
    security-sensitive and fully testable without real credentials."""

    def _sign(self, payload: bytes, secret: str, timestamp=None):
        timestamp = timestamp or int(time.time())
        signed_payload = f'{timestamp}.'.encode() + payload
        signature = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
        return f't={timestamp},v1={signature}'

    def test_valid_signature_is_accepted(self):
        payload = b'{"type": "checkout.session.completed"}'
        header = self._sign(payload, 'whsec_test_secret')
        self.assertTrue(_verify_webhook_signature(payload, header, 'whsec_test_secret'))

    def test_wrong_secret_is_rejected(self):
        payload = b'{"type": "checkout.session.completed"}'
        header = self._sign(payload, 'whsec_test_secret')
        self.assertFalse(_verify_webhook_signature(payload, header, 'whsec_a_different_secret'))

    def test_tampered_payload_is_rejected(self):
        payload = b'{"type": "checkout.session.completed"}'
        header = self._sign(payload, 'whsec_test_secret')
        tampered = b'{"type": "checkout.session.completed", "extra": "data"}'
        self.assertFalse(_verify_webhook_signature(tampered, header, 'whsec_test_secret'))

    def test_stale_timestamp_is_rejected(self):
        payload = b'{"type": "checkout.session.completed"}'
        old_timestamp = int(time.time()) - 3600  # 1 hour old
        header = self._sign(payload, 'whsec_test_secret', timestamp=old_timestamp)
        self.assertFalse(_verify_webhook_signature(payload, header, 'whsec_test_secret'))

    def test_malformed_header_is_rejected_not_crashed(self):
        self.assertFalse(_verify_webhook_signature(b'{}', 'garbage-header', 'whsec_test_secret'))
        self.assertFalse(_verify_webhook_signature(b'{}', '', 'whsec_test_secret'))


class WebhookEndpointTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.fake_db.store['orders'] = [{'id': 'order-1', 'total': 150.00, 'status': 'pending'}]

    def _sign(self, payload: bytes, secret: str):
        timestamp = int(time.time())
        signed_payload = f'{timestamp}.'.encode() + payload
        signature = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
        return f't={timestamp},v1={signature}'

    def test_without_webhook_secret_configured_it_acks_but_does_nothing(self):
        """The conservative, deliberate choice: an unconfigured webhook
        must never mark an order paid from an unverifiable request - that
        would be a free way to fake a payment."""
        with patch.dict('os.environ', {}, clear=False):
            import os
            os.environ.pop('STRIPE_WEBHOOK_SECRET', None)
            payload = json.dumps({
                'type': 'checkout.session.completed',
                'data': {'object': {'metadata': {'order_id': 'order-1'}}},
            }).encode()
            res = self.client.post('/api/webhooks/stripe', data=payload, content_type='application/json')
            self.assertEqual(res.status_code, 200)
            self.assertEqual(self.fake_db.store['orders'][0]['status'], 'pending')

    def test_with_a_valid_signature_it_marks_the_order_paid(self):
        payload = json.dumps({
            'type': 'checkout.session.completed',
            'data': {'object': {'metadata': {'order_id': 'order-1'}}},
        }).encode()
        with patch.dict('os.environ', {'STRIPE_WEBHOOK_SECRET': 'whsec_test_secret'}):
            header = self._sign(payload, 'whsec_test_secret')
            res = self.client.post(
                '/api/webhooks/stripe', data=payload, content_type='application/json',
                headers={'Stripe-Signature': header},
            )
            self.assertEqual(res.status_code, 200)
            self.assertEqual(self.fake_db.store['orders'][0]['status'], 'paid')

    def test_invalid_signature_is_rejected(self):
        payload = json.dumps({'type': 'checkout.session.completed'}).encode()
        with patch.dict('os.environ', {'STRIPE_WEBHOOK_SECRET': 'whsec_test_secret'}):
            res = self.client.post(
                '/api/webhooks/stripe', data=payload, content_type='application/json',
                headers={'Stripe-Signature': 't=123,v1=not-a-real-signature'},
            )
            self.assertEqual(res.status_code, 400)


if __name__ == '__main__':
    import unittest
    unittest.main()
