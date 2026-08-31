"""
Admin CRUD endpoints: auth gating (every admin route must reject a request
with no/bad token) and the specific product create/update logic that had a
real bug (writing nonexistent price/stock columns instead of base_price,
and never generating a slug).
"""

from base import ApiTestCase

ADMIN_ENDPOINTS = [
    ('GET', '/api/admin/products'),
    ('POST', '/api/admin/products'),
    ('GET', '/api/admin/bookings'),
    ('POST', '/api/admin/blocked-dates'),
    ('GET', '/api/admin/delivery-options'),
    ('POST', '/api/admin/delivery-options'),
    ('GET', '/api/admin/orders'),
    ('PUT', '/api/admin/settings'),
    ('GET', '/api/admin/dashboard/stats'),
]


class AuthGatingTests(ApiTestCase):
    def test_every_admin_endpoint_rejects_no_token(self):
        for method, path in ADMIN_ENDPOINTS:
            with self.subTest(endpoint=f'{method} {path}'):
                res = self.client.open(path, method=method, json={})
                self.assertEqual(res.status_code, 401, f'{method} {path} should require auth')

    def test_every_admin_endpoint_rejects_garbage_token(self):
        headers = {'Authorization': 'Bearer not-a-real-token'}
        for method, path in ADMIN_ENDPOINTS:
            with self.subTest(endpoint=f'{method} {path}'):
                res = self.client.open(path, method=method, json={}, headers=headers)
                self.assertEqual(res.status_code, 401, f'{method} {path} should reject a bad token')

    def test_valid_token_is_accepted(self):
        headers = self.auth_headers()
        res = self.client.get('/api/admin/products', headers=headers)
        self.assertEqual(res.status_code, 200)


class ProductCrudTests(ApiTestCase):
    def test_create_product_generates_slug_and_uses_base_price(self):
        """Regression test for the original bug: the admin create endpoint
        used to write 'price'/'stock' fields that don't exist on the
        products table, and never set a slug (which is NOT NULL UNIQUE),
        so creating a product was actually broken."""
        headers = self.auth_headers()
        res = self.client.post('/api/admin/products', json={
            'name': 'Garden Arch',
            'base_price': 150,
            'type': 'rental',
            'category': 'Arches',
        }, headers=headers)
        self.assertEqual(res.status_code, 201, res.get_json())
        product = res.get_json()
        self.assertEqual(product['slug'], 'garden-arch')
        self.assertEqual(product['base_price'], 150)
        self.assertNotIn('price', product)
        self.assertNotIn('stock', product)

    def test_create_product_deduplicates_slug(self):
        headers = self.auth_headers()
        first = self.client.post('/api/admin/products', json={'name': 'Garden Arch', 'base_price': 100}, headers=headers)
        second = self.client.post('/api/admin/products', json={'name': 'Garden Arch', 'base_price': 120}, headers=headers)
        self.assertEqual(first.get_json()['slug'], 'garden-arch')
        self.assertEqual(second.get_json()['slug'], 'garden-arch-2')

    def test_create_product_without_name_is_rejected(self):
        headers = self.auth_headers()
        res = self.client.post('/api/admin/products', json={'base_price': 100}, headers=headers)
        self.assertEqual(res.status_code, 400)

    def test_update_product_regenerates_slug_on_name_change(self):
        headers = self.auth_headers()
        created = self.client.post('/api/admin/products', json={'name': 'Old Name', 'base_price': 50}, headers=headers).get_json()
        updated = self.client.put(f"/api/admin/products/{created['id']}", json={'name': 'New Name'}, headers=headers)
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.get_json()['slug'], 'new-name')


class BlockedDateConflictTests(ApiTestCase):
    def test_blocking_an_already_blocked_date_returns_409_not_500(self):
        headers = self.auth_headers()
        first = self.client.post('/api/admin/blocked-dates', json={'date': '2026-12-25', 'reason': 'Day off'}, headers=headers)
        self.assertEqual(first.status_code, 201)

        second = self.client.post('/api/admin/blocked-dates', json={'date': '2026-12-25', 'reason': 'Also day off'}, headers=headers)
        self.assertEqual(second.status_code, 409)
        self.assertIn('already blocked', second.get_json()['error'])

    def test_unblocking_a_date_removes_it(self):
        headers = self.auth_headers()
        created = self.client.post('/api/admin/blocked-dates', json={'date': '2026-06-01'}, headers=headers).get_json()
        deleted = self.client.delete(f"/api/admin/blocked-dates/{created['id']}", headers=headers)
        self.assertEqual(deleted.status_code, 200)

        listing = self.client.get('/api/blocked-dates')
        self.assertEqual(listing.get_json(), [])


class DeliveryOptionSoftDeleteTests(ApiTestCase):
    def test_deactivating_hides_it_from_the_public_list_but_keeps_the_row(self):
        headers = self.auth_headers()
        created = self.client.post('/api/admin/delivery-options', json={'label': 'Courier'}, headers=headers).get_json()

        public_before = self.client.get('/api/delivery-options').get_json()
        self.assertEqual(len(public_before), 1)

        self.client.put(f"/api/admin/delivery-options/{created['id']}", json={'active': False}, headers=headers)

        public_after = self.client.get('/api/delivery-options').get_json()
        self.assertEqual(public_after, [])

        admin_listing = self.client.get('/api/admin/delivery-options', headers=headers).get_json()
        self.assertEqual(len(admin_listing), 1)
        self.assertFalse(admin_listing[0]['active'])


if __name__ == '__main__':
    import unittest
    unittest.main()
