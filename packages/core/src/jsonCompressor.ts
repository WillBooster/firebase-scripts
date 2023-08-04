import fsp from 'node:fs/promises';
import { brotliCompressSync, brotliDecompressSync, gunzipSync, gzipSync } from 'node:zlib';

import { Timestamp } from 'firebase-admin/firestore';

export type CompressionFormat = 'gzip' | 'brotli';
const defaultFormat = 'brotli';

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
  if (filePath.endsWith('.br')) return 'brotli';
}

export function getExtensionFromFormat(format?: CompressionFormat): string | undefined {
  if (format === 'gzip') return '.gz';
  if (format === 'brotli') return '.br';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reviverForJsonParse(key: string, value: any): any {
  if (!value) return value;
  if (value.type === 'Buffer') return Buffer.from(value);
  if (typeof value._seconds === 'number' && typeof value._nanoseconds === 'number' && Object.keys(value).length === 2) {
    return new Timestamp(value._seconds, value._nanoseconds);
  }
  return value;
}
