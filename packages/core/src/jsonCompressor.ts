import fsp from 'node:fs/promises';
import { brotliCompressSync, brotliDecompressSync, gunzipSync, gzipSync } from 'node:zlib';

import { Timestamp } from 'firebase-admin/firestore';

export type CompressionFormat = 'gzip' | 'brotli';
const defaultFormat = 'brotli';

/**
 * Compress and write a JSON object to a file.
 * @param obj A JSON object to compress.
 * @param filePath A path of the file to write.
 * @param format An optional compression format.
 */
export async function compressJson(obj: unknown, filePath: string, format?: CompressionFormat): Promise<void> {
  return compressJsonText(JSON.stringify(obj), filePath, format);
}

/**
 * Compress and write a JSON text to a file.
 * @param jsonText A JSON text to compress.
 * @param filePath A path of the file to write.
 * @param format An optional compression format.
 */
export async function compressJsonText(jsonText: string, filePath: string, format?: CompressionFormat): Promise<void> {
  format ??= getFormatFromExtension(filePath) ?? defaultFormat;
  const compressed = format === 'gzip' ? gzipSync(jsonText) : brotliCompressSync(jsonText);
  await fsp.writeFile(filePath, compressed);
}

/**
 * Read and decompress a JSON object from a file.
 * @param filePath A path of the file to read.
 * @param format An optional compression format.
 */
export async function decompressJson(filePath: string, format?: CompressionFormat): Promise<unknown> {
  return JSON.parse(await decompressJsonText(filePath, format), reviverForJsonParse);
}

/**
 * Read and decompress a JSON text from a file.
 * @param filePath A path of the file to read.
 * @param format An optional compression format.
 */
export async function decompressJsonText(filePath: string, format?: CompressionFormat): Promise<string> {
  format ??= getFormatFromExtension(filePath) ?? defaultFormat;
  const compressed = await fsp.readFile(filePath);
  const decompressed = format === 'gzip' ? gunzipSync(compressed) : brotliDecompressSync(compressed);
  return decompressed.toString();
}

/**
 * Get a compression format from a file extension.
 * @param filePath A path of the file.
 */
export function getFormatFromExtension(filePath: string): CompressionFormat | undefined {
  if (filePath.endsWith('.gz')) return 'gzip';
  if (filePath.endsWith('.br')) return 'brotli';
}

/**
 * Get a file extension from a compression format.
 * @param format A compression format.
 */
export function getExtensionFromFormat(format?: CompressionFormat): string | undefined {
  if (format === 'gzip') return '.gz';
  if (format === 'brotli') return '.br';
}

/**
 * A reviver function for JSON.parse().
 * @param key Key of an object
 * @param value Value of an object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reviverForJsonParse(key: string, value: any): any {
  if (!value) return value;
  if (value.type === 'Buffer') return Buffer.from(value);
  if (typeof value._seconds === 'number' && typeof value._nanoseconds === 'number' && Object.keys(value).length === 2) {
    return new Timestamp(value._seconds, value._nanoseconds);
  }
  return value;
}
