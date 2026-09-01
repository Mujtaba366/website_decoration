"""
Site settings save/load round-trip.

This is the backend half of the `service_area_note` bug class found in the
correctness sweep: a field that's editable in the admin form but silently
does nothing. That particular bug was on the *display* side (nothing read
the value). The equivalent bug on the *save* side would be a field the
admin form sends that isn't in admin_settings.py's SETTINGS_FIELDS
whitelist - update_settings() silently drops anything not in that tuple
(no error, 200 response, the field is just never written). This suite
exists so that gap is fenced going forward: every field the actual admin
form (frontend/app/admin/settings/page.tsx) sends is round-tripped here,
so forgetting to add a new field to the backend whitelist fails a test
instead of failing silently in production.
"""

from base import ApiTestCase

# Mirrors the exact set of fields frontend/app/admin/settings/page.tsx's
# SiteSettingsForm sends in its PUT body. If that form gains a field, add
# it here too - that's the whole point of this list existing.
FRONTEND_FORM_FIELDS = (
    'site_name', 'tagline', 'support_email', 'phone', 'location',
    'instagram_handle', 'service_area_note', 'business_hours', 'footer_note',
    'hero_eyebrow', 'hero_heading', 'hero_subheading',
    'cta_heading', 'cta_subheading',
    'about_heading', 'about_subheading', 'about_story',
    'how_it_works_heading', 'how_it_works_subheading',
    'contact_heading', 'contact_subheading',
    'contact_intro_heading', 'contact_intro_text',
    'rentals_eyebrow', 'rentals_heading', 'rentals_subheading',
    'shop_eyebrow', 'shop_heading', 'shop_subheading',
)


class SiteSettingsTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        # A site_settings row with id=1 always exists in the real database
        # (seeded by migration) - mirror that here so update's .eq('id', 1)
        # has something to match, same as production.
        self.fake_db.store['site_settings'] = [{'id': 1, 'site_name': 'Original Name'}]

    def test_get_settings_is_public_no_auth_needed(self):
        res = self.client.get('/api/settings')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()['site_name'], 'Original Name')

    def test_get_settings_returns_empty_object_if_no_row_exists(self):
        self.fake_db.store['site_settings'] = []
        res = self.client.get('/api/settings')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json(), {})

    def test_every_field_the_real_admin_form_sends_survives_a_round_trip(self):
        """The regression test for the exact bug class this file exists to
        catch: PUT every field the admin form actually sends, then GET, and
        confirm every single one came back exactly as sent. If a future
        change adds a field to the frontend form but not to
        admin_settings.SETTINGS_FIELDS, this fails here instead of just
        quietly not saving in production."""
        headers = self.auth_headers()
        payload = {field: f'test-value-for-{field}' for field in FRONTEND_FORM_FIELDS}

        put_res = self.client.put('/api/admin/settings', json=payload, headers=headers)
        self.assertEqual(put_res.status_code, 200, put_res.get_json())

        get_res = self.client.get('/api/settings')
        body = get_res.get_json()
        for field in FRONTEND_FORM_FIELDS:
            with self.subTest(field=field):
                self.assertEqual(body.get(field), f'test-value-for-{field}',
                                  f'{field} did not survive the save/load round-trip')

    def test_saving_one_field_does_not_clobber_others(self):
        headers = self.auth_headers()
        self.client.put('/api/admin/settings', json={'site_name': 'New Name', 'tagline': 'New Tagline'}, headers=headers)
        self.client.put('/api/admin/settings', json={'phone': '021 000 0000'}, headers=headers)

        body = self.client.get('/api/settings').get_json()
        self.assertEqual(body['site_name'], 'New Name')
        self.assertEqual(body['tagline'], 'New Tagline')
        self.assertEqual(body['phone'], '021 000 0000')

    def test_unrecognized_field_is_dropped_not_errored(self):
        """Documents current behavior explicitly: an unknown field is
        silently ignored (200, not saved) rather than rejected. Not
        necessarily the ideal behavior, but this test makes it a documented
        choice rather than an accident - if this ever changes, it should
        change here on purpose."""
        headers = self.auth_headers()
        res = self.client.put('/api/admin/settings', json={
            'site_name': 'Kept',
            'this_field_does_not_exist': 'should be dropped',
        }, headers=headers)
        self.assertEqual(res.status_code, 200)

        body = self.client.get('/api/settings').get_json()
        self.assertEqual(body['site_name'], 'Kept')
        self.assertNotIn('this_field_does_not_exist', body)

    def test_put_with_no_recognized_fields_returns_400(self):
        headers = self.auth_headers()
        res = self.client.put('/api/admin/settings', json={'nonsense': 'x'}, headers=headers)
        self.assertEqual(res.status_code, 400)


if __name__ == '__main__':
    import unittest
    unittest.main()
