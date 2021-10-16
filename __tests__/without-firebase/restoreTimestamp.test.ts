import { firestore } from 'firebase-admin';

import { restoreTimestamp } from '../../src';

test.each([
  [{ id: 'a', date: firestore.Timestamp.fromDate(new Date(0)) }, false],
  [{ id: 'a', date: { _nanoseconds: 0, _seconds: 0 } }, true],
])('restoreTimestamp(%p)', async (record: Record<string, unknown>, expected: boolean) => {
  expect(restoreTimestamp(record)).toBe(expected);
});
