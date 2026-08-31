"""
What the API does when Supabase is unreachable, slow, or returns garbage -
this doesn't touch the Flask app at all, just the low-level HTTP wrapper and
the error-formatting logic that sits on top of it.
"""

import os
import sys
import unittest
from unittest.mock import patch
import requests

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.supabase_client import SupabaseClient, SupabaseError  # noqa: E402
from app.view import handle_error, require_body  # noqa: E402
from web import app as flask_app  # noqa: E402


class FlaskContextTestCase(unittest.TestCase):
    """jsonify() (used throughout view.py, including in handle_error and
    require_body) needs an active Flask app context - it's not a pure
    function despite how it's used here."""
    def setUp(self):
        self._ctx = flask_app.app_context()
        self._ctx.push()
        self.addCleanup(self._ctx.pop)


class SupabaseUnreachableTests(unittest.TestCase):
    def setUp(self):
        self.client = SupabaseClient('https://fake.supabase.co', 'fake-key')

    @patch('app.supabase_client.requests.request')
    def test_connection_error_becomes_503_not_a_raw_exception(self, mock_request):
        mock_request.side_effect = requests.exceptions.ConnectionError('DNS lookup failed')
        with self.assertRaises(SupabaseError) as ctx:
            self.client.table('products').select('*').execute()
        self.assertEqual(ctx.exception.status_code, 503)

    @patch('app.supabase_client.requests.request')
    def test_timeout_becomes_503_with_a_clear_message(self, mock_request):
        mock_request.side_effect = requests.exceptions.Timeout()
        with self.assertRaises(SupabaseError) as ctx:
            self.client.table('products').insert({'name': 'x'}).execute()
        self.assertEqual(ctx.exception.status_code, 503)
        self.assertIn('Timed out', str(ctx.exception))

    @patch('app.supabase_client.requests.request')
    def test_every_table_operation_uses_a_timeout(self, mock_request):
        """Without an explicit timeout, a hung Supabase connection would hang
        the Flask request (and whoever's waiting on it) forever."""
        mock_request.return_value.status_code = 200
        mock_request.return_value.json.return_value = []

        self.client.table('products').select('*').execute()
        self.client.table('products').insert({'name': 'x'}).execute()
        self.client.table('products').update({'name': 'y'}).eq('id', '1').execute()
        self.client.table('products').delete().eq('id', '1').execute()

        for call in mock_request.call_args_list:
            self.assertIn('timeout', call.kwargs, 'every request must pass an explicit timeout')
            self.assertIsNotNone(call.kwargs['timeout'])


class ErrorFormattingTests(FlaskContextTestCase):
    def test_503_gets_a_friendly_unavailable_message(self):
        response, status = handle_error(SupabaseError(503, 'connection refused'))
        self.assertEqual(status, 503)
        body = response.get_json()
        self.assertIn('temporarily unavailable', body['error'])
        self.assertEqual(body['details'], 'connection refused')

    def test_409_gets_a_conflict_message(self):
        response, status = handle_error(SupabaseError(409, 'duplicate key'))
        self.assertEqual(status, 409)
        self.assertIn('conflicts', response.get_json()['error'])

    def test_generic_exception_falls_back_to_400_with_details(self):
        response, status = handle_error(ValueError('something unexpected'))
        self.assertEqual(status, 400)
        body = response.get_json()
        self.assertIn('error', body)
        self.assertEqual(body['details'], 'something unexpected')


class RequireBodyTests(FlaskContextTestCase):
    def test_none_is_rejected(self):
        self.assertIsNotNone(require_body(None))

    def test_empty_dict_is_rejected(self):
        self.assertIsNotNone(require_body({}))

    def test_populated_dict_is_accepted(self):
        self.assertIsNone(require_body({'name': 'x'}))


if __name__ == '__main__':
    unittest.main()
