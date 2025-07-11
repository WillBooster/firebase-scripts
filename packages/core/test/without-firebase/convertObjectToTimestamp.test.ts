import { Timestamp } from 'firebase-admin/firestore';
import { expect, test } from 'vitest';

import { convertObjectToTimestamp } from '../../src';

test.each([
  [{ id: 'a', date: Timestamp.fromDate(new Date(0)) }, false],
  [{ id: 'a', date: { _nanoseconds: 0, _seconds: 0 } }, true],
])(
  'convertObjectToTimestamp(%p)',
  async (record: Record<string, unknown>, expected: boolean) => {
    expect(convertObjectToTimestamp(record)).toBe(expected);
  },
  180 * 1000
);
