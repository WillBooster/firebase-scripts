import fs from 'node:fs';
import fsp from 'node:fs/promises';

import type { App } from 'firebase-admin/app';
import type { CollectionReference } from 'firebase-admin/firestore';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import { decompressJsonText, getFormatFromExtension, reviverForJsonParse } from './jsonCompressor';
import { promisePool } from './promisePool';

/**
 * Import a collection from a file.
 * @param adminApp An app of firebase admin.
 * @param filePath A path of the file to import.
 * @param collectionPath An optional slash-separated collection path to import.
 */
export async function importCollection(adminApp: App, filePath: string, collectionPath?: string): Promise<void> {
  if (!collectionPath) {
    const dotIndex = filePath.indexOf('.');
    collectionPath = filePath.slice(0, dotIndex >= 0 ? dotIndex : undefined);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`${filePath} does not exist.`);
    return;
  }

  const format = getFormatFromExtension(filePath);
  const records = JSON.parse(
    await (format ? decompressJsonText(filePath, format) : fsp.readFile(filePath, 'utf8')),
    reviverForJsonParse
  );
  if (!Array.isArray(records)) {
    console.error(`${filePath} is not valid json.`);
    return;
  }

  console.info(`Start restoring: ${collectionPath}`);
  const count = await restoreCollection(records, getFirestore(adminApp).collection(collectionPath));
  console.info(`Restored records: ${count}`);
}

/**
 * Restore a collection from record objects.
 * @param records An array of record objects to restore.
 * @param collection A collection reference to restore.
 */
export async function restoreCollection(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  records: Record<string, any>[],
  collection: CollectionReference
): Promise<number> {
  let count = 0;
  for (const record of records) {
    if (!record.docId) continue;

    const docId = record.docId;
    delete record.docId;

    await promisePool.run(() => collection.doc(docId).set(record));
    count++;
    if (count % 1000 === 0) {
      console.info(`${count} / ${records.length}`);
    }
  }
  await promisePool.promiseAll();
  console.info(`${count} / ${records.length}`);
  console.info(`Done (${records.length - count} records are skipped due to the lack of 'docId' filed)`);
  return count;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertObjectToTimestamp(record: Record<string, any>): boolean {
  let modified = false;
  for (const [key, value] of Object.entries(record)) {
    if (value && typeof value === 'object' && !(value instanceof Timestamp)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { _nanoseconds, _seconds } = value as any;
      if (Object.keys(value).length === 2 && typeof _seconds === 'number' && typeof _nanoseconds === 'number') {
        record[key] = new Timestamp(_seconds, _nanoseconds);
        modified = true;
      } else {
        modified ||= convertObjectToTimestamp(value);
      }
    }
  }
  return modified;
}
