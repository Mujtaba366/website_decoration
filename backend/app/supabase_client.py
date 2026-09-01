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
    """Returns the backend's one Supabase client, authenticated with the
    SERVICE ROLE KEY - not the anon key.

    This changed as part of the RLS lockdown: every table's RLS policy used
    to be wide open (`anon, authenticated USING (true)`) purely because this
    function authenticated as anon, and the backend needed to be able to do
    its own job. Now that RLS is locked down per-table (public tables are
    anon-SELECT-only; everything else has zero anon/authenticated policies
    at all - see the individual migrations and SECURITY_DEBT.md), the
    backend needs a credential that bypasses RLS to keep working, since
    Flask already does its own authorization (`verify_admin_token` on every
    admin route, basic validation on public routes) - RLS is not meant to
    additionally gate the backend's own trusted server-side code, only to
    stop someone from bypassing Flask and hitting Supabase's REST API
    directly with a key they found.

    Never expose this client or its key to the frontend or any untrusted
    context - it can read and write every table unconditionally."""
    global _client
    if _client is None:
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        if not url or not key:
            raise Exception('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
        _client = SupabaseClient(url, key)
    return _client


def get_supabase_admin_client() -> SupabaseClient:
    """Identical to get_supabase_client() as of the RLS lockdown - both now
    read SUPABASE_SERVICE_ROLE_KEY. Kept as a separate function only because
    payment_settings.py and stripe_payments.py already called it by this
    name before the rest of the backend switched over too; merging them is
    safe to do later but not necessary. Do not reintroduce a
    distinction between the two - there should only ever be one backend
    credential now."""
    global _admin_client
    if _admin_client is None:
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        if not url or not key:
            raise Exception('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
        _admin_client = SupabaseClient(url, key)
    return _admin_client
