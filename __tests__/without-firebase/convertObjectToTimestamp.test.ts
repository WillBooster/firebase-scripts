import { firestore } from 'firebase-admin';

import { convertObjectToTimestamp } from '../../src';

test.each([
  [{ id: 'a', date: firestore.Timestamp.fromDate(new Date(0)) }, false],
  [{ id: 'a', date: { _nanoseconds: 0, _seconds: 0 } }, true],
])('convertObjectToTimestamp(%p)', async (record: Record<string, unknown>, expected: boolean) => {
  expect(convertObjectToTimestamp(record)).toBe(expected);
});
