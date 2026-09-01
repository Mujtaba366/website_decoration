"""
Admin auth endpoints: login, logout, verify, and change-password.

Includes a regression test for a real bug found in this session's
correctness sweep: admin_change_password() checked the current password
against the in-memory ADMIN_USERS fallback only, never against the actual
Supabase admin_users row - unlike admin_login(), which already checked
Supabase first. Since the whole point of storing the password in plaintext
in Supabase is so it can be read/managed directly from the database, this
meant changing the password there would make "Change Password" in the admin
UI reject the correct current password.
"""

from base import ApiTestCase
from api.admin_views import ADMIN_USERS


class LoginLogoutTests(ApiTestCase):
    def test_login_with_correct_in_memory_credentials_succeeds(self):
        res = self.client.post('/api/admin/login/', json={'username': 'admin', 'password': 'changeme123'})
        self.assertEqual(res.status_code, 200)
        self.assertIn('token', res.get_json())

    def test_login_with_wrong_password_is_rejected(self):
        res = self.client.post('/api/admin/login/', json={'username': 'admin', 'password': 'wrong'})
        self.assertEqual(res.status_code, 401)

    def test_login_with_unknown_username_is_rejected(self):
        res = self.client.post('/api/admin/login/', json={'username': 'nobody', 'password': 'x'})
        self.assertEqual(res.status_code, 401)

    def test_login_prefers_the_supabase_row_over_the_in_memory_fallback(self):
        """admin_login() is supposed to check Supabase first - seed a
        Supabase-only password that differs from the in-memory default and
        confirm it's actually used."""
        self.fake_db.store['admin_users'] = [{'id': 'db-1', 'username': 'admin', 'password': 'from-the-database'}]
        res = self.client.post('/api/admin/login/', json={'username': 'admin', 'password': 'from-the-database'})
        self.assertEqual(res.status_code, 200)

    def test_logout_invalidates_the_session(self):
        token = self.login()
        logout_res = self.client.post('/api/admin/logout/', headers=self.auth_headers(token))
        self.assertEqual(logout_res.status_code, 200)

        verify_res = self.client.get('/api/admin/verify/', headers=self.auth_headers(token))
        self.assertEqual(verify_res.status_code, 401)

    def test_verify_reports_valid_for_a_live_session(self):
        token = self.login()
        res = self.client.get('/api/admin/verify/', headers=self.auth_headers(token))
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()['valid'])


class ChangePasswordTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        # ADMIN_USERS is a module-level dict shared across the whole test
        # run - restore it after every test in this class so a password
        # change here can't break login for tests elsewhere in the suite.
        self.addCleanup(lambda: ADMIN_USERS.__setitem__(
            'admin', {'password': 'changeme123', 'id': ADMIN_USERS['admin']['id'], 'username': 'admin'}
        ))

    def test_wrong_current_password_is_rejected(self):
        headers = self.auth_headers()
        res = self.client.post('/api/admin/change-password/', json={
            'current_password': 'not-the-real-one',
            'new_password': 'newpassword123',
        }, headers=headers)
        self.assertEqual(res.status_code, 401)

    def test_correct_in_memory_current_password_succeeds(self):
        headers = self.auth_headers()
        res = self.client.post('/api/admin/change-password/', json={
            'current_password': 'changeme123',
            'new_password': 'newpassword123',
        }, headers=headers)
        self.assertEqual(res.status_code, 200)
        # The new password should work for the next login.
        login_res = self.client.post('/api/admin/login/', json={'username': 'admin', 'password': 'newpassword123'})
        self.assertEqual(login_res.status_code, 200)

    def test_regression_current_password_is_checked_against_supabase_not_just_memory(self):
        """The actual bug: seed Supabase with a password that differs from
        the in-memory default, log in with it (proving it's the "real"
        current password), then confirm change-password accepts it as the
        current password instead of rejecting it because it doesn't match
        the stale in-memory 'changeme123'."""
        self.fake_db.store['admin_users'] = [{'id': 'db-1', 'username': 'admin', 'password': 'set-directly-in-supabase'}]

        login_res = self.client.post('/api/admin/login/', json={'username': 'admin', 'password': 'set-directly-in-supabase'})
        self.assertEqual(login_res.status_code, 200)
        token = login_res.get_json()['token']

        change_res = self.client.post('/api/admin/change-password/', json={
            'current_password': 'set-directly-in-supabase',
            'new_password': 'brand-new-password',
        }, headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(change_res.status_code, 200, change_res.get_json())

        # And the Supabase row itself should have been updated.
        self.assertEqual(self.fake_db.store['admin_users'][0]['password'], 'brand-new-password')

    def test_missing_fields_returns_400(self):
        headers = self.auth_headers()
        res = self.client.post('/api/admin/change-password/', json={'current_password': 'changeme123'}, headers=headers)
        self.assertEqual(res.status_code, 400)

    def test_requires_authentication(self):
        res = self.client.post('/api/admin/change-password/', json={
            'current_password': 'changeme123',
            'new_password': 'x',
        })
        self.assertEqual(res.status_code, 401)


class DebugSessionsTests(ApiTestCase):
    """Regression coverage for a real leak: this endpoint used to return
    live session tokens and admin usernames to anyone, unauthenticated."""

    def test_requires_authentication(self):
        res = self.client.get('/api/admin/debug/sessions')
        self.assertEqual(res.status_code, 401)

    def test_rejects_an_invalid_token(self):
        res = self.client.get('/api/admin/debug/sessions', headers={'Authorization': 'Bearer not-a-real-token'})
        self.assertEqual(res.status_code, 401)

    def test_authenticated_admin_gets_a_session_count_only(self):
        token = self.login()
        res = self.client.get('/api/admin/debug/sessions', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertEqual(body['active_sessions'], 1)
        # Must never again leak raw tokens or the admin username list.
        self.assertNotIn('sessions', body)
        self.assertNotIn('admin_users', body)


if __name__ == '__main__':
    import unittest
    unittest.main()
