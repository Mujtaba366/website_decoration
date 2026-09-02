"""
The admin session store, now backed by the admin_sessions Supabase table
instead of an in-process dict. Covers the expiry behavior every
admin-gated endpoint relies on, the cleanup-of-expired-rows behavior, and
graceful degradation when Supabase itself fails - plus the actual
regression this rewrite exists to fix: a session must be valid regardless
of which process (in production, which gunicorn worker) looks it up.
"""

import os
import sys
import unittest
from unittest.mock import patch
from datetime import datetime, timedelta, timezone
from importlib import reload

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from tests.fake_supabase import FakeSupabaseClient  # noqa: E402


class SessionStoreTests(unittest.TestCase):
    def setUp(self):
        self.fake_db = FakeSupabaseClient()
        self.patcher = patch('api.session_store.get_supabase_client', return_value=self.fake_db)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)
        from api import session_store
        self.session_store = session_store

    def test_create_then_verify_succeeds(self):
        self.session_store.create_session('tok-1', 'admin', 'id-1')
        self.assertTrue(self.session_store.verify_session('tok-1'))

    def test_create_returns_a_session_id_and_get_session_matches_old_shape(self):
        """admin_views.py reads session['username'] and session['id'] -
        confirms the rewrite kept the exact same dict shape callers rely on."""
        session_id = self.session_store.create_session('tok-1', 'admin', 'admin-id-1')
        session = self.session_store.get_session('tok-1')
        self.assertEqual(session['id'], session_id)
        self.assertEqual(session['username'], 'admin')
        self.assertEqual(session['admin_id'], 'admin-id-1')

    def test_unknown_token_fails_verification(self):
        self.assertFalse(self.session_store.verify_session('never-issued'))

    def test_expired_session_fails_verification_and_is_evicted(self):
        self.session_store.create_session('tok-1', 'admin', 'id-1')
        # Backdate expiry directly in the fake table - create_session
        # always sets +24h, so simulate the passage of time rather than
        # waiting a day in a test.
        row = self.fake_db.store['admin_sessions'][0]
        row['expires_at'] = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()

        self.assertFalse(self.session_store.verify_session('tok-1'))
        # verify_session should have cleaned it up, not just reported false.
        self.assertEqual(self.fake_db.store['admin_sessions'], [])

    def test_delete_session_removes_it(self):
        self.session_store.create_session('tok-1', 'admin', 'id-1')
        self.assertTrue(self.session_store.delete_session('tok-1'))
        self.assertFalse(self.session_store.verify_session('tok-1'))

    def test_delete_unknown_session_returns_false_not_an_error(self):
        self.assertFalse(self.session_store.delete_session('never-issued'))

    def test_get_all_sessions_excludes_expired_ones(self):
        self.session_store.create_session('fresh', 'admin', 'id-1')
        self.session_store.create_session('stale', 'admin', 'id-2')
        stale_row = next(r for r in self.fake_db.store['admin_sessions'] if r['token'] == 'stale')
        stale_row['expires_at'] = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()

        active = self.session_store.get_all_sessions()
        self.assertIn('fresh', active)
        self.assertNotIn('stale', active)

    def test_creating_a_new_session_cleans_up_expired_rows(self):
        """Expired rows shouldn't accumulate forever - create_session()
        opportunistically deletes them rather than needing a cron job."""
        self.session_store.create_session('old', 'admin', 'id-1')
        old_row = self.fake_db.store['admin_sessions'][0]
        old_row['expires_at'] = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()

        self.session_store.create_session('new', 'admin', 'id-2')

        tokens = [r['token'] for r in self.fake_db.store['admin_sessions']]
        self.assertNotIn('old', tokens)
        self.assertIn('new', tokens)


class SessionStoreFailureModeTests(unittest.TestCase):
    """A failed or slow Supabase call during verification must fail closed
    (session treated as invalid) - never fail open (treated as valid,
    which would be a real vulnerability), and never crash the request with
    an unhandled exception. A transient failure just means "log in again",
    not a permanent lockout - the very next call tries Supabase fresh."""

    def test_get_session_returns_none_on_a_supabase_error(self):
        with patch('api.session_store.get_supabase_client', side_effect=Exception('connection refused')):
            from api import session_store
            self.assertIsNone(session_store.get_session('any-token'))

    def test_verify_session_fails_closed_on_a_supabase_error(self):
        with patch('api.session_store.get_supabase_client', side_effect=Exception('connection refused')):
            from api import session_store
            self.assertFalse(session_store.verify_session('any-token'))

    def test_delete_session_returns_false_on_a_supabase_error_not_a_crash(self):
        fake_db = FakeSupabaseClient()
        with patch('api.session_store.get_supabase_client', return_value=fake_db):
            from api import session_store
            session_store.create_session('tok-1', 'admin', 'id-1')

        with patch('api.session_store.get_supabase_client', side_effect=Exception('connection refused')):
            self.assertFalse(session_store.delete_session('tok-1'))

    def test_get_all_sessions_returns_empty_dict_on_a_supabase_error(self):
        with patch('api.session_store.get_supabase_client', side_effect=Exception('connection refused')):
            from api import session_store
            self.assertEqual(session_store.get_all_sessions(), {})

    def test_a_transient_failure_does_not_permanently_lock_out_a_valid_session(self):
        """The self-correcting half of "fail closed, not permanently
        closed": once Supabase is reachable again, the same token that
        failed to verify during the outage verifies again immediately -
        nothing about the failure was persisted."""
        fake_db = FakeSupabaseClient()
        with patch('api.session_store.get_supabase_client', return_value=fake_db):
            from api import session_store
            session_store.create_session('tok-1', 'admin', 'id-1')

        with patch('api.session_store.get_supabase_client', side_effect=Exception('timeout')):
            self.assertFalse(session_store.verify_session('tok-1'))

        with patch('api.session_store.get_supabase_client', return_value=fake_db):
            self.assertTrue(session_store.verify_session('tok-1'))


class CrossProcessSessionTests(unittest.TestCase):
    """The actual production bug: a session created by one gunicorn worker
    process 401'd on every other worker, because the old implementation
    stored sessions in a plain module-level dict private to whichever
    process happened to handle the login. Simulates "a different process"
    by reloading session_store - reload() re-executes the module from
    scratch exactly as a brand-new worker starting up would, so any state
    that used to live in a module-level global (like the old
    ADMIN_SESSIONS = {}) gets wiped. If sessions still lived in the module
    itself, this test would fail the same way production did; it passes
    only because the actual source of truth is the shared Supabase table
    (here, the fake db this test controls directly), which reload() does
    not touch."""

    def test_a_session_created_before_a_reload_is_still_valid_after_it(self):
        fake_db = FakeSupabaseClient()
        with patch('api.session_store.get_supabase_client', return_value=fake_db):
            from api import session_store
            session_store.create_session('shared-token', 'admin', 'id-1')

        import api.session_store as session_store_module
        reload(session_store_module)
        # reload() re-runs `from app.supabase_client import
        # get_supabase_client` at the top of the module, which re-binds it
        # to the real (unpatched) function - undoing the mock, the same
        # way a real second worker process would independently import and
        # connect to the same real Supabase project rather than share a
        # Python reference at all. Reapply against the SAME fake_db to
        # model "a different process talking to the same external
        # database", not "the same process with the same objects".
        session_store_module.get_supabase_client = lambda: fake_db

        self.assertTrue(session_store_module.verify_session('shared-token'))


if __name__ == '__main__':
    unittest.main()
