"""
Regression coverage for a real, previously-undocumented gap found while
planning the Stripe receipt work: /api/bookings, /api/orders, /api/messages,
and /api/payments had NO auth check at all on GET/PUT/DELETE - only POST
(customer-facing create) was ever meant to be public. Anyone could list
every customer's name/contact/order contents, or delete/edit any record,
with no token - independent of and in addition to the RLS lockdown (this is
a Flask-layer gap; RLS only closes the "bypass Flask, hit Supabase directly"
path). Confirmed via grep before fixing that the frontend never calls these
methods on these routes - only POST is ever used - so gating them has no
functional impact on the live site.

POST stays intentionally unauthenticated on all four - customers still need
to create their own bookings/orders/messages/payments without logging in.
"""

from base import ApiTestCase

LEGACY_ENDPOINTS_REQUIRING_AUTH = [
    ('GET', '/api/bookings'),
    ('GET', '/api/bookings/does-not-exist'),
    ('PUT', '/api/bookings/does-not-exist'),
    ('DELETE', '/api/bookings/does-not-exist'),
    ('GET', '/api/orders'),
    ('GET', '/api/orders/does-not-exist'),
    ('PUT', '/api/orders/does-not-exist'),
    ('DELETE', '/api/orders/does-not-exist'),
    ('GET', '/api/messages'),
    ('GET', '/api/messages/does-not-exist'),
    ('DELETE', '/api/messages/does-not-exist'),
    ('GET', '/api/payments'),
    ('GET', '/api/payments/does-not-exist'),
    ('PUT', '/api/payments/does-not-exist'),
    ('DELETE', '/api/payments/does-not-exist'),
]


class LegacyPublicEndpointAuthTests(ApiTestCase):
    def test_every_listed_endpoint_rejects_no_token(self):
        for method, path in LEGACY_ENDPOINTS_REQUIRING_AUTH:
            with self.subTest(endpoint=f'{method} {path}'):
                res = self.client.open(path, method=method, json={})
                self.assertEqual(res.status_code, 401, f'{method} {path} should require auth')

    def test_every_listed_endpoint_rejects_garbage_token(self):
        headers = {'Authorization': 'Bearer not-a-real-token'}
        for method, path in LEGACY_ENDPOINTS_REQUIRING_AUTH:
            with self.subTest(endpoint=f'{method} {path}'):
                res = self.client.open(path, method=method, json={}, headers=headers)
                self.assertEqual(res.status_code, 401, f'{method} {path} should reject a bad token')

    def test_valid_admin_token_can_still_list_each_table(self):
        headers = self.auth_headers()
        for method, path in [('GET', '/api/bookings'), ('GET', '/api/orders'), ('GET', '/api/messages'), ('GET', '/api/payments')]:
            with self.subTest(endpoint=f'{method} {path}'):
                res = self.client.get(path, headers=headers)
                self.assertEqual(res.status_code, 200)

    def test_creating_a_booking_still_needs_no_auth(self):
        """The one thing that must stay public - a customer submitting the
        booking form has no admin token and shouldn't need one."""
        self.fake_db.store.setdefault('products', []).append(
            {'id': 'prod-1', 'name': 'Test Arch', 'slug': 'test-arch', 'base_price': 100}
        )
        res = self.client.post('/api/bookings', json={
            'product_id': 'prod-1',
            'customer_name': 'Jane Smith',
            'contact': 'jane@example.com',
            'event_date': '2026-12-25',
            'fulfillment_type': 'pickup',
            'status': 'enquiry',
        })
        self.assertEqual(res.status_code, 201)

    def test_creating_an_order_still_needs_no_auth(self):
        res = self.client.post('/api/orders', json={
            'customer_name': 'Jane Smith',
            'contact': 'jane@example.com',
            'items': [],
            'total': 0,
            'payment_method': 'bank_transfer',
            'status': 'pending',
        })
        self.assertEqual(res.status_code, 201)

    def test_creating_a_message_still_needs_no_auth(self):
        res = self.client.post('/api/messages', json={'sender_name': 'Jane', 'content': 'Hello'})
        self.assertEqual(res.status_code, 201)

    def test_creating_a_payment_still_needs_no_auth(self):
        res = self.client.post('/api/payments', json={'method': 'bank_transfer', 'amount': 50, 'status': 'pending'})
        self.assertEqual(res.status_code, 201)


if __name__ == '__main__':
    import unittest
    unittest.main()
