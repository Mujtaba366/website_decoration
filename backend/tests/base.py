"""
Shared test scaffolding: puts backend/ on sys.path (so `import app...` and
`import api...` resolve the same way they do when web.py is run directly),
imports the real Flask app once, and patches every module's own
`get_supabase_client` name (each does `from app.supabase_client import
get_supabase_client`, which binds a separate reference in each module's
namespace - patching the source module alone would not affect those) to
return a fresh FakeSupabaseClient per test.

Run with:
    venv/Scripts/python.exe -m unittest discover -s backend/tests -p "test_*.py" -v
(from the repo root)
"""

import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from web import app as flask_app  # noqa: E402
from tests.fake_supabase import FakeSupabaseClient  # noqa: E402

# Every module that does `from app.supabase_client import get_supabase_client`.
# If a future admin_*.py adds this import, add it here too or its tests will
# silently hit the real network client instead of the fake.
PATCH_TARGETS = [
    'app.view.get_supabase_client',
    'api.admin_dashboard.get_supabase_client',
    'api.admin_rentals.get_supabase_client',
    'api.admin_delivery.get_supabase_client',
    'api.admin_settings.get_supabase_client',
    'api.admin_orders.get_supabase_client',
    'api.admin_views.get_supabase_client',
    'api.admin_uploads.get_supabase_client',
    'api.payment_settings.get_supabase_admin_client',
    'api.stripe_payments.get_supabase_client',
    'api.stripe_payments.get_supabase_admin_client',
    'api.session_store.get_supabase_client',
]


class ApiTestCase(unittest.TestCase):
    def setUp(self):
        self.fake_db = FakeSupabaseClient()
        self._patchers = [patch(target, return_value=self.fake_db) for target in PATCH_TARGETS]
        for p in self._patchers:
            p.start()
        self.addCleanup(self._stop_patchers)

        flask_app.testing = True
        self.client = flask_app.test_client()
        # session_store now reads/writes the admin_sessions table via the
        # patched get_supabase_client above, so each test's fresh
        # FakeSupabaseClient already starts with no sessions - no separate
        # cleanup needed here the way the old in-memory dict required.

    def _stop_patchers(self):
        for p in self._patchers:
            p.stop()

    def login(self, username='admin', password='changeme123'):
        """Logs in via the real endpoint (exercising the real auth code path,
        not a shortcut) and returns the bearer token."""
        res = self.client.post(
            '/api/admin/login/',
            json={'username': username, 'password': password},
        )
        assert res.status_code == 200, f'login failed in test setup: {res.get_json()}'
        return res.get_json()['token']

    def auth_headers(self, token=None):
        token = token or self.login()
        return {'Authorization': f'Bearer {token}'}
