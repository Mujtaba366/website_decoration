"""
The admin auth token store - pure in-memory logic, no Flask or Supabase
involved. Covers the expiry behavior every admin-gated endpoint relies on.
"""

import os
import sys
from datetime import datetime, timedelta
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api import session_store  # noqa: E402


class SessionStoreTests(unittest.TestCase):
    def setUp(self):
        session_store.ADMIN_SESSIONS.clear()
        self.addCleanup(session_store.ADMIN_SESSIONS.clear)

    def test_create_then_verify_succeeds(self):
        session_store.create_session('tok-1', 'admin', 'id-1')
        self.assertTrue(session_store.verify_session('tok-1'))

    def test_unknown_token_fails_verification(self):
        self.assertFalse(session_store.verify_session('never-issued'))

    def test_expired_session_fails_verification_and_is_evicted(self):
        session_store.create_session('tok-1', 'admin', 'id-1')
        # Backdate expiry directly - create_session always sets +24h, so
        # simulate the passage of time rather than waiting a day in a test.
        session_store.ADMIN_SESSIONS['tok-1']['expires_at'] = datetime.now() - timedelta(seconds=1)

        self.assertFalse(session_store.verify_session('tok-1'))
        # verify_session should have cleaned it up, not just reported false.
        self.assertNotIn('tok-1', session_store.ADMIN_SESSIONS)

    def test_delete_session_removes_it(self):
        session_store.create_session('tok-1', 'admin', 'id-1')
        self.assertTrue(session_store.delete_session('tok-1'))
        self.assertFalse(session_store.verify_session('tok-1'))

    def test_delete_unknown_session_returns_false_not_an_error(self):
        self.assertFalse(session_store.delete_session('never-issued'))

    def test_get_all_sessions_excludes_expired_ones(self):
        session_store.create_session('fresh', 'admin', 'id-1')
        session_store.create_session('stale', 'admin', 'id-2')
        session_store.ADMIN_SESSIONS['stale']['expires_at'] = datetime.now() - timedelta(seconds=1)

        active = session_store.get_all_sessions()
        self.assertIn('fresh', active)
        self.assertNotIn('stale', active)


if __name__ == '__main__':
    unittest.main()
