import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from 'vitest';

import { compressJson, decompressJson } from '../../src';

test.each([
  [{ a: 1, b: 'test' }, 'gz'],
  [{ xxx: 'abc', yyy: 0.5 }, 'br'],
  [{ b1: Buffer.from([0x61]), b2: Buffer.from([0x00, 0x62, 0xff]) }, 'br'],
])(
  'de/compress(%p)',
  async (obj, ext) => {
    const filePath = path.resolve('test-fixtures', 'temp', `test.json.${ext}`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    await compressJson(obj, filePath);
    expect(await decompressJson(filePath)).toEqual(obj);
  },
  180 * 1000
);
