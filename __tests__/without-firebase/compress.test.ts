import fs from 'fs';
import path from 'path';

import { compressJson, decompressJson } from '../../src/jsonCompressor';

test.each`
  obj
  ${{ a: 1, b: 'test' }}
  ${{ xxx: 'abc', yyy: 0.5 }}
`('de/compress($obj)', async ({ obj }) => {
  const filePath = path.resolve('test-fixtures', 'temp', 'test.json.gz');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  compressJson(obj, filePath);
  expect(decompressJson(filePath)).toEqual(obj);
});
