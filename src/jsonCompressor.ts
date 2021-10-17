import fs from 'fs';

import { gunzipSync, gzipSync, strFromU8, strToU8 } from 'fflate';

export function compressJson(obj: unknown, filePath: string): void {
  compressJsonText(JSON.stringify(obj), filePath);
}

export function compressJsonText(jsonText: string, filePath: string): void {
  const buf = strToU8(jsonText);
  const compressed = gzipSync(buf);
  fs.writeFileSync(filePath, compressed);
}

export function decompressJson(filePath: string): any {
  const decompressed = gunzipSync(fs.readFileSync(filePath));
  return JSON.parse(strFromU8(decompressed));
}
