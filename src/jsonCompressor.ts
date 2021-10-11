import fs from 'fs';

import { gunzipSync, gzipSync, strFromU8, strToU8 } from 'fflate';

export function compressJson(obj: unknown, ...filePaths: string[]): void {
  const buf = strToU8(JSON.stringify(obj));
  const compressed = gzipSync(buf);
  for (const filePath of filePaths) {
    fs.writeFileSync(filePath, compressed);
  }
}

export function decompressJson(filePath: string): any {
  const decompressed = gunzipSync(fs.readFileSync(filePath));
  return JSON.parse(strFromU8(decompressed));
}
