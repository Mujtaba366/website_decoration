"""
An in-memory stand-in for the hand-rolled Supabase REST client
(app/supabase_client.py), used so tests exercise the real Flask view/route
code without making any network calls to the live Supabase project.

Mirrors the real client's chainable interface (.table().select().eq().execute(),
.table().insert(...).execute(), etc.) closely enough that view functions can't
tell the difference. Also simulates the one thing the actual booking-race fix
depends on: a UNIQUE constraint on blocked_dates.date, enforced the same way
Postgres would (a 409 on the second conflicting insert).

Not a general-purpose Postgres emulator - just enough behavior to test the
application logic that sits on top of it.
"""

import uuid
from app.supabase_client import SupabaseError

# Tables with a unique constraint the fake should enforce, mirroring the real
# schema. Extend this if a future migration adds another UNIQUE column.
UNIQUE_CONSTRAINTS = {
    'blocked_dates': [('date',)],
    'products': [('slug',)],
    'admin_users': [('username',)],
}


class FakeResult:
    def __init__(self, data):
        self.data = data


class FakeTable:
    def __init__(self, store, name):
        self.store = store
        self.name = name
        self._filters = []

    def select(self, columns='*'):
        return self

    def eq(self, column, value):
        self._filters.append((column, str(value)))
        return self

    def execute(self):
        rows = self.store.setdefault(self.name, [])
        matched = [r for r in rows if all(str(r.get(c)) == v for c, v in self._filters)]
        return FakeResult([dict(r) for r in matched])

    def insert(self, data):
        return FakeInsert(self.store, self.name, data)

    def update(self, data):
        return FakeUpdate(self.store, self.name, data)

    def delete(self):
        return FakeDelete(self.store, self.name)


class FakeInsert:
    def __init__(self, store, name, data):
        self.store = store
        self.name = name
        self.data = data

    def execute(self):
        rows = self.store.setdefault(self.name, [])
        for cols in UNIQUE_CONSTRAINTS.get(self.name, []):
            if any(all(r.get(c) == self.data.get(c) for c in cols) for r in rows):
                col_desc = ','.join(cols)
                raise SupabaseError(
                    409,
                    f'duplicate key value violates unique constraint "{self.name}_{col_desc}_key"'
                )
        row = dict(self.data)
        row.setdefault('id', str(uuid.uuid4()))
        rows.append(row)
        return FakeResult([dict(row)])


class FakeUpdate:
    def __init__(self, store, name, data):
        self.store = store
        self.name = name
        self.data = data
        self._filters = []

    def eq(self, column, value):
        self._filters.append((column, str(value)))
        return self

    def execute(self):
        rows = self.store.setdefault(self.name, [])
        matched = [r for r in rows if all(str(r.get(c)) == v for c, v in self._filters)]
        for r in matched:
            r.update(self.data)
        return FakeResult([dict(r) for r in matched])


class FakeDelete:
    def __init__(self, store, name):
        self.store = store
        self.name = name
        self._filters = []

    def eq(self, column, value):
        self._filters.append((column, str(value)))
        return self

    def execute(self):
        rows = self.store.setdefault(self.name, [])
        matched = [r for r in rows if all(str(r.get(c)) == v for c, v in self._filters)]
        self.store[self.name] = [r for r in rows if r not in matched]
        return FakeResult([])


class FakeSupabaseClient:
    def __init__(self, seed=None):
        # seed: optional {table_name: [row_dict, ...]}
        self.store = {k: [dict(r) for r in v] for k, v in (seed or {}).items()}
        self.uploaded_files = []  # [(bucket, path, content_type, len(data)), ...]

    def table(self, name):
        return FakeTable(self.store, name)

    def upload_file(self, bucket, path, data, content_type):
        self.uploaded_files.append((bucket, path, content_type, len(data)))
        return f'https://fake.supabase.co/storage/v1/object/public/{bucket}/{path}'
