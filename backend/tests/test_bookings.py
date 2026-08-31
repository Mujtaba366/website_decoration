"""
Covers the logic where a bug actually costs money or double-books:
- the global calendar blocking a date across every rental product
- the booking race condition fix (claim-before-create)
- date strings passing through unmodified (no server-side timezone shift)
- bad-input handling on the booking endpoint
"""

from base import ApiTestCase


class BookingConflictTests(ApiTestCase):
    def _make_product(self):
        row = {'id': 'prod-1', 'name': 'Test Arch', 'slug': 'test-arch', 'base_price': 100}
        self.fake_db.store.setdefault('products', []).append(row)
        return row

    def test_booking_creates_and_blocks_the_date_globally(self):
        self._make_product()
        res = self.client.post('/api/bookings', json={
            'product_id': 'prod-1',
            'customer_name': 'Jane Smith',
            'contact': 'jane@example.com',
            'event_date': '2026-12-25',
            'fulfillment_type': 'pickup',
            'status': 'enquiry',
        })
        self.assertEqual(res.status_code, 201, res.get_json())
        booking = res.get_json()
        self.assertEqual(booking['event_date'], '2026-12-25')

        blocked = self.fake_db.store.get('blocked_dates', [])
        self.assertEqual(len(blocked), 1)
        self.assertEqual(blocked[0]['date'], '2026-12-25')
        # The global calendar entry must be linked back to this exact booking -
        # this is what makes it a *global* block rather than per-product.
        self.assertEqual(blocked[0]['booking_id'], booking['id'])

    def test_second_booking_on_a_different_product_same_date_is_rejected(self):
        """The whole point of the global calendar: one operator, one date,
        blocked for every product - not just the one that was booked first."""
        self._make_product()
        first = self.client.post('/api/bookings', json={
            'product_id': 'prod-1',
            'customer_name': 'Jane Smith',
            'contact': 'jane@example.com',
            'event_date': '2026-12-25',
            'fulfillment_type': 'pickup',
            'status': 'enquiry',
        })
        self.assertEqual(first.status_code, 201)

        second = self.client.post('/api/bookings', json={
            'product_id': 'some-other-product-entirely',
            'customer_name': 'Someone Else',
            'contact': 'other@example.com',
            'event_date': '2026-12-25',
            'fulfillment_type': 'setup',
            'status': 'enquiry',
        })
        self.assertEqual(second.status_code, 409)
        self.assertIn('no longer available', second.get_json()['error'])

        # Only the first booking should exist - the conflicting request must
        # not have created a phantom booking row before failing.
        self.assertEqual(len(self.fake_db.store.get('bookings', [])), 1)
        self.assertEqual(len(self.fake_db.store.get('blocked_dates', [])), 1)

    def test_double_booking_race_leaves_exactly_one_booking(self):
        """Simulates the actual race this fix closes: two requests for the
        same date, back to back, before either could see the other's write.
        Since the fake DB is synchronous this can't interleave mid-request
        the way two real concurrent HTTP requests could, but it still proves
        the *ordering* is correct: the date is claimed (and the UNIQUE
        constraint enforced) before a booking row is ever created, so the
        loser fails before creating anything - not after."""
        self._make_product()
        payload = {
            'product_id': 'prod-1',
            'customer_name': 'Racer One',
            'contact': 'one@example.com',
            'event_date': '2026-11-11',
            'fulfillment_type': 'pickup',
            'status': 'enquiry',
        }
        r1 = self.client.post('/api/bookings', json=payload)
        r2 = self.client.post('/api/bookings', json={**payload, 'customer_name': 'Racer Two'})

        statuses = sorted([r1.status_code, r2.status_code])
        self.assertEqual(statuses, [201, 409])
        self.assertEqual(len(self.fake_db.store.get('bookings', [])), 1)

    def test_booking_insert_failure_releases_the_claimed_date(self):
        """If claiming the date succeeds but creating the booking itself
        fails for an unrelated reason, the date must not stay stuck as
        blocked with no booking behind it."""
        # No product row seeded and no required-field issue - instead force
        # the underlying insert to fail by omitting a value that would
        # violate a real NOT NULL constraint conceptually. Since the fake DB
        # doesn't enforce NOT NULL, simulate the failure directly by breaking
        # the bookings table's insert.
        self._make_product()
        original_insert = self.fake_db.store

        from tests.fake_supabase import FakeTable
        real_insert = FakeTable.insert

        def failing_insert(self, data):
            if self.name == 'bookings':
                raise Exception('simulated insert failure')
            return real_insert(self, data)

        FakeTable.insert = failing_insert
        try:
            res = self.client.post('/api/bookings', json={
                'product_id': 'prod-1',
                'customer_name': 'Jane Smith',
                'contact': 'jane@example.com',
                'event_date': '2026-10-10',
                'fulfillment_type': 'pickup',
                'status': 'enquiry',
            })
        finally:
            FakeTable.insert = real_insert

        self.assertEqual(res.status_code, 400)
        self.assertEqual(self.fake_db.store.get('bookings', []), [])
        # The claim must have been rolled back, not left stranded.
        self.assertEqual(self.fake_db.store.get('blocked_dates', []), [])

    def test_missing_required_fields_returns_400_not_a_crash(self):
        res = self.client.post('/api/bookings', json={'customer_name': 'Incomplete'})
        self.assertEqual(res.status_code, 400)
        self.assertIn('Missing required field', res.get_json()['error'])
        self.assertEqual(self.fake_db.store.get('bookings', []), [])

    def test_empty_body_returns_400_not_a_crash(self):
        res = self.client.post(
            '/api/bookings',
            data='',
            content_type='application/json',
        )
        # Flask's own JSON parsing rejects an empty body before the view
        # runs; the global 400 handler should still return JSON, not HTML.
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.content_type, 'application/json')

    def test_null_body_returns_400_not_a_crash(self):
        res = self.client.post(
            '/api/bookings',
            data='null',
            content_type='application/json',
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('required', res.get_json()['error'])


class UpdateReturns404WhenMissingTests(ApiTestCase):
    """Regression tests for a real bug found in the correctness sweep: every
    update_* view in app/view.py returned 200 with a null body for a
    nonexistent id, instead of 404 - silently "succeeding" at updating
    something that was never found."""

    def test_update_booking_not_found(self):
        res = self.client.put('/api/bookings/does-not-exist', json={'status': 'confirmed'})
        self.assertEqual(res.status_code, 404)

    def test_update_order_not_found(self):
        res = self.client.put('/api/orders/does-not-exist', json={'status': 'paid'})
        self.assertEqual(res.status_code, 404)

    def test_update_product_not_found(self):
        res = self.client.put('/api/products/does-not-exist', json={'name': 'x'})
        self.assertEqual(res.status_code, 404)

    def test_update_payment_not_found(self):
        res = self.client.put('/api/payments/does-not-exist', json={'status': 'paid'})
        self.assertEqual(res.status_code, 404)

    def test_update_availability_not_found(self):
        res = self.client.put('/api/availability/does-not-exist', json={'is_available': False})
        self.assertEqual(res.status_code, 404)


if __name__ == '__main__':
    import unittest
    unittest.main()
