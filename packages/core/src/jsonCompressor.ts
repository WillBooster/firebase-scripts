import fsp from 'node:fs/promises';
import { brotliCompressSync, brotliDecompressSync, gunzipSync, gzipSync } from 'node:zlib';

import { firestore } from 'firebase-admin';

export type CompressionFormat = 'gzip' | 'brotil';
const defaultFormat = 'brotil';

export async function compressJson(obj: unknown, filePath: string, format?: CompressionFormat): Promise<void> {
  return compressJsonText(JSON.stringify(obj), filePath, format);
}

export async function compressJsonText(jsonText: string, filePath: string, format?: CompressionFormat): Promise<void> {
  format ??= getFormatFromExtension(filePath) ?? defaultFormat;
  const compressed = format === 'gzip' ? gzipSync(jsonText) : brotliCompressSync(jsonText);
  await fsp.writeFile(filePath, compressed);
}

export async function decompressJson(filePath: string, format?: CompressionFormat): Promise<unknown> {
  return JSON.parse(await decompressJsonText(filePath, format), reviverForJsonParse);
}

export async function decompressJsonText(filePath: string, format?: CompressionFormat): Promise<string> {
  format ??= getFormatFromExtension(filePath) ?? defaultFormat;
  const compressed = await fsp.readFile(filePath);
  const decompressed = format === 'gzip' ? gunzipSync(compressed) : brotliDecompressSync(compressed);
  return decompressed.toString();
}

export function getFormatFromExtension(filePath: string): CompressionFormat | undefined {
  if (filePath.endsWith('.gz')) return 'gzip';
  if (filePath.endsWith('.br')) return 'brotil';
}

export function getExtensionFromFormat(format?: CompressionFormat): string | undefined {
  if (format === 'gzip') return '.gz';
  if (format === 'brotil') return '.br';
}

export function reviverForJsonParse(key: string, value: any): any {
  if (!value) return value;
  if (value.type === 'Buffer') return Buffer.from(value);
  if (typeof value._seconds === 'number' && typeof value._nanoseconds === 'number' && Object.keys(value).length === 2) {
    return new firestore.Timestamp(value._seconds, value._nanoseconds);
  }
  return value;
}
