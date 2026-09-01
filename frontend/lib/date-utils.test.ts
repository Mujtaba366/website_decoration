// Run with: node --test lib/date-utils.test.ts   (from the frontend/ directory)
// Node 22+ runs .ts files with simple type annotations natively - no
// ts-node, no jest/vitest, no new dependency needed for this. You'll see a
// one-line "MODULE_TYPELESS_PACKAGE_JSON" warning on stderr - harmless
// (Node just has to guess CJS vs ESM without a "type" field in
// package.json); not fixed by adding one there since that would change how
// Next.js itself loads next.config.js/postcss.config.js/etc.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { toDateOnly, fromDateOnly, isDateAvailable, isWithinAuckland, AUCKLAND_POSTCODES } from './date-utils.ts';

describe('toDateOnly', () => {
  test('formats a date using local components, zero-padded', () => {
    assert.equal(toDateOnly(new Date(2026, 7, 31)), '2026-08-31'); // month is 0-indexed
    assert.equal(toDateOnly(new Date(2026, 0, 5)), '2026-01-05');
    assert.equal(toDateOnly(new Date(2026, 11, 1)), '2026-12-01');
  });

  test('does not shift the date regardless of the time-of-day component', () => {
    // This is the exact bug that shipped once: toISOString() converts to
    // UTC first, which can roll the date backward by one day for any local
    // time before the local UTC offset - e.g. midnight local time in a
    // timezone ahead of UTC becomes "yesterday" in UTC. toDateOnly must
    // never do that: local midnight and local 23:59 on the same day must
    // produce the same YYYY-MM-DD string.
    const midnight = new Date(2026, 7, 31, 0, 0, 0);
    const lastMinute = new Date(2026, 7, 31, 23, 59, 59);
    assert.equal(toDateOnly(midnight), '2026-08-31');
    assert.equal(toDateOnly(lastMinute), '2026-08-31');
  });

  test('never delegates to toISOString (regression guard)', () => {
    // A blunt but effective guard: construct a date whose UTC day differs
    // from its local day in every timezone with a positive UTC offset
    // (which includes NZ, where this app is deployed) and confirm the
    // result matches the LOCAL day, not toISOString()'s UTC day.
    const d = new Date(2026, 7, 31, 0, 30); // 00:30 local
    const viaToDateOnly = toDateOnly(d);
    const viaToISOString = d.toISOString().split('T')[0];
    // In UTC (or any timezone with offset <= 0) these happen to match, so
    // this assertion is only meaningful in positive-offset timezones - but
    // asserting toDateOnly's own contract (matches local getters) holds
    // everywhere, which is what actually matters.
    assert.equal(viaToDateOnly, `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    void viaToISOString; // documented for context, not asserted against directly
  });
});

describe('fromDateOnly', () => {
  test('parses a YYYY-MM-DD string into a local-midnight Date', () => {
    const d = fromDateOnly('2026-08-31');
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 7); // 0-indexed
    assert.equal(d.getDate(), 31);
    assert.equal(d.getHours(), 0);
  });

  test('round-trips through toDateOnly unchanged', () => {
    for (const dateStr of ['2026-01-01', '2026-08-31', '2026-12-25', '2027-02-28']) {
      assert.equal(toDateOnly(fromDateOnly(dateStr)), dateStr);
    }
  });

  test('never delegates to `new Date(dateStr)` (regression guard)', () => {
    // new Date('2026-08-31') parses as UTC midnight, not local midnight -
    // the same class of off-by-one-day bug as toISOString(), just in the
    // opposite direction. Confirm fromDateOnly's result matches local
    // getters constructed the safe way (new Date(y, m-1, d)), not the
    // ISO-string constructor.
    const viaFromDateOnly = fromDateOnly('2026-08-31');
    const viaSafeConstructor = new Date(2026, 7, 31);
    assert.equal(viaFromDateOnly.getTime(), viaSafeConstructor.getTime());
  });
});

describe('isDateAvailable', () => {
  const today = new Date(2026, 7, 15); // fixed "now" - 15 August 2026

  test('a future date with nothing blocked is available', () => {
    assert.equal(isDateAvailable(new Date(2026, 7, 20), new Set(), today), true);
  });

  test('a past date is never available, blocked or not', () => {
    assert.equal(isDateAvailable(new Date(2026, 7, 10), new Set(), today), false);
  });

  test('today itself is available if not blocked (boundary case)', () => {
    assert.equal(isDateAvailable(new Date(2026, 7, 15), new Set(), today), true);
  });

  test('a future date that is in the global blocked-dates set is unavailable', () => {
    const blocked = new Set(['2026-08-20']);
    assert.equal(isDateAvailable(new Date(2026, 7, 20), blocked, today), false);
  });

  test('blocking one date does not affect a different date', () => {
    const blocked = new Set(['2026-08-20']);
    assert.equal(isDateAvailable(new Date(2026, 7, 21), blocked, today), true);
  });

  test('defaults `today` to the real current time when not passed explicitly', () => {
    // Just confirms the default parameter exists and doesn't throw - the
    // other tests above pin down the actual date-comparison behavior with
    // an explicit `today` so they aren't flaky based on when they run.
    assert.doesNotThrow(() => isDateAvailable(new Date(2099, 0, 1), new Set()));
  });
});

describe('isWithinAuckland', () => {
  test('matches a known Auckland-range postcode embedded in a full address', () => {
    assert.equal(isWithinAuckland('123 Ponsonby Road, Ponsonby, Auckland 1011'), true);
  });

  test('rejects an address with no 4-digit postcode at all', () => {
    assert.equal(isWithinAuckland('123 Ponsonby Road, Ponsonby'), false);
  });

  test('rejects a postcode outside the list entirely', () => {
    // 9016 is Dunedin - nowhere near the list's 0600-2999 range.
    assert.equal(isWithinAuckland('1 Octagon, Dunedin 9016'), false);
  });

  test('the postcode list stays within the documented 0600-2999 range', () => {
    // Locks in current behavior so a future edit that silently narrows or
    // widens the range gets caught here, even though (per date-utils.ts's
    // own comment) the upper end of this range is broader than the real
    // Auckland region and hasn't been corrected without an authoritative
    // source to verify against.
    for (const code of AUCKLAND_POSTCODES) {
      const n = Number(code);
      assert.ok(n >= 600 && n <= 2999, `${code} outside expected range`);
    }
  });
});
