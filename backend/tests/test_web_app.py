"""
App-level infrastructure: the root health-check route and CORS_ORIGINS
parsing. Both are regression tests for a real production incident - the
deployed backend was being cycled by Render's health check (which defaults
to GET / for a web service) hitting a 404, and separately, CORS_ORIGINS was
effectively stuck on the local-dev default, so the deployed frontend's
requests were silently rejected by the browser (every OPTIONS preflight
returned 200, but with no Access-Control-Allow-Origin header at all, since
the deployed origin never matched). Neither of these touches Supabase, so
these tests build the Flask app directly rather than going through
ApiTestCase/FakeSupabaseClient.
"""

import os
import sys
import unittest
from unittest.mock import patch
from importlib import reload

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


class RootHealthCheckTests(unittest.TestCase):
    def setUp(self):
        import web
        web.app.testing = True
        self.client = web.app.test_client()

    def test_root_returns_200(self):
        """Render's default health check path for a web service is '/' -
        before this route existed, this 404'd and the service got cycled."""
        res = self.client.get('/')
        self.assertEqual(res.status_code, 200)

    def test_api_health_still_returns_200(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)


class CorsOriginsParsingTests(unittest.TestCase):
    """Rebuilds the Flask app with a fresh CORS_ORIGINS value for each test,
    since web.py reads the env var once at import time."""

    def _build_app_with_origins(self, value):
        with patch.dict(os.environ, {'CORS_ORIGINS': value}):
            import web
            reload(web)
            web.app.testing = True
            return web.app.test_client()

    def _preflight(self, client, origin):
        return client.open(
            '/api/settings', method='OPTIONS',
            headers={'Origin': origin, 'Access-Control-Request-Method': 'GET'},
        )

    def test_exact_origin_match_gets_cors_headers(self):
        client = self._build_app_with_origins('https://example.com')
        res = self._preflight(client, 'https://example.com')
        self.assertEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://example.com')

    def test_trailing_slash_in_configured_origin_still_matches(self):
        """The actual production bug shape: a trailing slash pasted into the
        env var (e.g. copied from a browser address bar) used to mean the
        browser's Origin header (which never has a trailing slash) could
        never match, so Flask-CORS silently added no CORS headers at all -
        still a 200 on the OPTIONS request, but the browser then refuses to
        send the real request. Fixed by stripping trailing slashes when
        parsing CORS_ORIGINS in web.py."""
        client = self._build_app_with_origins('https://example.com/')
        res = self._preflight(client, 'https://example.com')
        self.assertEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://example.com')

    def test_whitespace_around_origins_is_trimmed(self):
        client = self._build_app_with_origins('https://a.com, https://b.com')
        res = self._preflight(client, 'https://b.com')
        self.assertEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://b.com')

    def test_mismatched_origin_gets_no_cors_headers(self):
        """Documents the exact failure mode seen in production: a 200
        response with zero Access-Control-* headers, not a 403 - easy to
        misread server-side access logs as "it worked"."""
        client = self._build_app_with_origins('https://example.com')
        res = self._preflight(client, 'https://a-different-site.com')
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.headers.get('Access-Control-Allow-Origin'))

    def tearDown(self):
        # Reload once more with no CORS_ORIGINS override so later test
        # modules (which import `web` fresh) don't inherit a patched env's
        # leftover state via Python's module cache.
        import web
        reload(web)


if __name__ == '__main__':
    unittest.main()
