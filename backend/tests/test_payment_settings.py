"""
Payment settings split: bank account number + Stripe config live in
payment_settings, a table with no anon RLS policy at all (see the real
migration - verified separately against the live Supabase project, not
something the fake DB can simulate). These tests cover the application
logic layered on top: the public endpoint only ever returns the narrow
customer-safe subset, the admin endpoints require auth, and a Stripe
secret key can never be accepted through the update endpoint because
there's no field for it in the whitelist at all.
"""

from base import ApiTestCase

PUBLIC_FIELDS = (
    'bank_account_number', 'bank_account_name', 'bank_transfer_enabled',
    'stripe_enabled', 'stripe_publishable_key', 'currency',
)


class PaymentConfigPublicEndpointTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.fake_db.store['payment_settings'] = [{
            'id': 1,
            'bank_account_number': '12-3456-7890123-00',
            'bank_account_name': 'Bloom and Vow Ltd',
            'bank_transfer_enabled': True,
            'stripe_enabled': False,
            'stripe_publishable_key': None,
            'stripe_success_url': 'https://example.com/success',
            'stripe_cancel_url': 'https://example.com/cancel',
            'currency': 'NZD',
        }]

    def test_public_endpoint_needs_no_auth(self):
        res = self.client.get('/api/payment-config')
        self.assertEqual(res.status_code, 200)

    def test_public_endpoint_returns_the_bank_account_number(self):
        """The one deliberate exception: customers must see this to pay by
        bank transfer, even though the underlying table is otherwise locked
        down."""
        body = self.client.get('/api/payment-config').get_json()
        self.assertEqual(body['bank_account_number'], '12-3456-7890123-00')

    def test_public_endpoint_never_returns_admin_only_fields(self):
        body = self.client.get('/api/payment-config').get_json()
        self.assertNotIn('stripe_success_url', body)
        self.assertNotIn('stripe_cancel_url', body)
        self.assertNotIn('id', body)

    def test_public_endpoint_returns_exactly_the_documented_field_set(self):
        body = self.client.get('/api/payment-config').get_json()
        self.assertEqual(set(body.keys()), set(PUBLIC_FIELDS))


class PaymentSettingsAdminEndpointTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.fake_db.store['payment_settings'] = [{'id': 1, 'bank_transfer_enabled': True, 'stripe_enabled': False, 'currency': 'NZD'}]

    def test_get_requires_authentication(self):
        res = self.client.get('/api/admin/payment-settings')
        self.assertEqual(res.status_code, 401)

    def test_put_requires_authentication(self):
        res = self.client.put('/api/admin/payment-settings', json={'bank_account_number': 'x'})
        self.assertEqual(res.status_code, 401)

    def test_authenticated_get_returns_full_row(self):
        headers = self.auth_headers()
        res = self.client.get('/api/admin/payment-settings', headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn('currency', res.get_json())

    def test_updating_bank_account_number_round_trips(self):
        headers = self.auth_headers()
        put_res = self.client.put('/api/admin/payment-settings', json={
            'bank_account_number': '99-8888-7777777-01',
            'bank_account_name': 'Test Business',
        }, headers=headers)
        self.assertEqual(put_res.status_code, 200, put_res.get_json())

        public_body = self.client.get('/api/payment-config').get_json()
        self.assertEqual(public_body['bank_account_number'], '99-8888-7777777-01')

    def test_a_stripe_secret_key_field_is_silently_dropped_not_stored(self):
        """There is no stripe_secret_key column and no such field in
        ADMIN_EDITABLE_FIELDS at all - confirms that even a client that
        tried to send one couldn't get it stored here."""
        headers = self.auth_headers()
        res = self.client.put('/api/admin/payment-settings', json={
            'bank_account_number': '11-1111-1111111-01',
            'stripe_secret_key': 'sk_live_should_never_be_stored',
        }, headers=headers)
        self.assertEqual(res.status_code, 200)

        stored = self.fake_db.store['payment_settings'][0]
        self.assertNotIn('stripe_secret_key', stored)

    def test_put_with_no_recognized_fields_returns_400(self):
        headers = self.auth_headers()
        res = self.client.put('/api/admin/payment-settings', json={'nonsense': 'x'}, headers=headers)
        self.assertEqual(res.status_code, 400)


if __name__ == '__main__':
    import unittest
    unittest.main()
