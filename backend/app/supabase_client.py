import os
import requests
from dotenv import load_dotenv

load_dotenv()

# How long to wait for Supabase before giving up. Without this, a hung
# connection to Supabase would hang the Flask request indefinitely.
REQUEST_TIMEOUT = 10


class SupabaseError(Exception):
    """Raised on a non-2xx response from the Supabase REST API. Carries the
    HTTP status code so callers can distinguish e.g. a 409 unique-constraint
    conflict from other failures without parsing the error message text.
    Also raised (with status_code=503) when Supabase can't be reached at all
    (DNS failure, connection refused, timeout) - see _request() below."""
    def __init__(self, status_code: int, text: str):
        self.status_code = status_code
        self.text = text
        super().__init__(f'Supabase error: {status_code} - {text}')


def _request(method, url, headers, **kwargs):
    """Shared HTTP call for every table operation. Applies a timeout and
    turns network-level failures (DNS, connection refused, timeout) into a
    SupabaseError(503) instead of letting a raw requests exception escape -
    without this, an unreachable Supabase would surface as a confusing
    ConnectionError string with the wrong status code."""
    try:
        return requests.request(method, url, headers=headers, timeout=REQUEST_TIMEOUT, **kwargs)
    except requests.exceptions.Timeout:
        raise SupabaseError(503, 'Timed out waiting for the database. Please try again.')
    except requests.exceptions.RequestException as e:
        raise SupabaseError(503, f'Could not reach the database: {e}')


class SupabaseClient:
    def __init__(self, url: str, key: str):
        self.url = url.rstrip('/')
        self.key = key
        self.headers = {
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'apikey': key,
            'Prefer': 'return=representation',
        }

    def table(self, name: str):
        return SupabaseTable(self.url, self.headers, name)

    def upload_file(self, bucket: str, path: str, data: bytes, content_type: str) -> str:
        """Uploads bytes to a Supabase Storage bucket via the raw REST API
        (no supabase-py/storage3 dependency, matching how every table
        operation in this client is already hand-rolled with `requests`).
        Returns the public URL - the bucket must be public for this to be
        useful, which is true for 'product-images'."""
        url = f'{self.url}/storage/v1/object/{bucket}/{path}'
        headers = {
            'Authorization': self.headers['Authorization'],
            'apikey': self.headers['apikey'],
            'Content-Type': content_type,
            'x-upsert': 'true',
        }
        response = _request('POST', url, headers, data=data)
        if response.status_code not in (200, 201):
            raise SupabaseError(response.status_code, response.text)
        return f'{self.url}/storage/v1/object/public/{bucket}/{path}'

class SupabaseTable:
    def __init__(self, url: str, headers: dict, table_name: str):
        self.url = url
        self.headers = headers
        self.table_name = table_name
        self.query = None
        self.filters = []
        self.limit_count = None

    def select(self, columns: str = '*'):
        self.query = 'select=' + columns
        return self

    def eq(self, column: str, value):
        self.filters.append(f'{column}=eq.{value}')
        return self

    def execute(self):
        url = f'{self.url}/rest/v1/{self.table_name}'
        params = []
        if self.query:
            params.append(self.query)
        params.extend(self.filters)
        if self.limit_count:
            params.append(f'limit={self.limit_count}')

        if params:
            url += '?' + '&'.join(params)

        response = _request('GET', url, self.headers)

        class Result:
            def __init__(self, data):
                self.data = data

        if response.status_code == 200:
            return Result(response.json())
        else:
            raise SupabaseError(response.status_code, response.text)

    def insert(self, data):
        return SupabaseInsert(self.url, self.headers, self.table_name, data)

    def update(self, data):
        return SupabaseUpdate(self.url, self.headers, self.table_name, data)

    def delete(self):
        return SupabaseDelete(self.url, self.headers, self.table_name)

class SupabaseInsert:
    def __init__(self, url: str, headers: dict, table_name: str, data):
        self.url = url
        self.headers = headers
        self.table_name = table_name
        self.data = data

    def execute(self):
        url = f'{self.url}/rest/v1/{self.table_name}'
        response = _request('POST', url, self.headers, json=self.data)

        class Result:
            def __init__(self, data):
                self.data = data

        if response.status_code in [200, 201]:
            return Result(response.json())
        else:
            raise SupabaseError(response.status_code, response.text)

class SupabaseUpdate:
    def __init__(self, url: str, headers: dict, table_name: str, data):
        self.url = url
        self.headers = headers
        self.table_name = table_name
        self.data = data
        self.filters = []

    def eq(self, column: str, value):
        self.filters.append(f'{column}=eq.{value}')
        return self

    def execute(self):
        url = f'{self.url}/rest/v1/{self.table_name}'
        if self.filters:
            url += '?' + '&'.join(self.filters)

        response = _request('PATCH', url, self.headers, json=self.data)

        class Result:
            def __init__(self, data):
                self.data = data

        if response.status_code == 200:
            return Result(response.json())
        else:
            raise SupabaseError(response.status_code, response.text)

class SupabaseDelete:
    def __init__(self, url: str, headers: dict, table_name: str):
        self.url = url
        self.headers = headers
        self.table_name = table_name
        self.filters = []

    def eq(self, column: str, value):
        self.filters.append(f'{column}=eq.{value}')
        return self

    def execute(self):
        url = f'{self.url}/rest/v1/{self.table_name}'
        if self.filters:
            url += '?' + '&'.join(self.filters)

        response = _request('DELETE', url, self.headers)

        class Result:
            def __init__(self, data=None):
                self.data = data or []

        if response.status_code in [200, 204]:
            return Result()
        else:
            raise SupabaseError(response.status_code, response.text)

_client = None
_admin_client = None

def get_supabase_client() -> SupabaseClient:
    global _client
    if _client is None:
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_KEY')
        if not url or not key:
            raise Exception('SUPABASE_URL and SUPABASE_KEY must be set in .env')
        _client = SupabaseClient(url, key)
    return _client


def get_supabase_admin_client() -> SupabaseClient:
    """Returns a client authenticated with the service-role key, which
    bypasses Row Level Security entirely. Every other table in this project
    uses the anon key with fully-open RLS - this is the one deliberate
    exception, reserved for the payment_settings table (bank account
    number, Stripe config), which has RLS enabled with no anon/authenticated
    policies at all. That table is unreachable with the anon key by design;
    only code that has gone through this function can read or write it.
    Do not use this for anything else - reach for get_supabase_client()
    for every other table."""
    global _admin_client
    if _admin_client is None:
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        if not url or not key:
            raise Exception('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
        _admin_client = SupabaseClient(url, key)
    return _admin_client
