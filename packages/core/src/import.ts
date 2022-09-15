import fs from 'node:fs';
import fsp from 'node:fs/promises';

import { app, firestore } from 'firebase-admin';

import { decompressJsonText, getFormatFromExtension, reviverForJsonParse } from './jsonCompressor';
import { promisePool } from './promisePool';

export async function importCollection(adminApp: app.App, filePath: string, collectionPath?: string): Promise<void> {
  if (!collectionPath) {
    const dotIndex = filePath.indexOf('.');
    collectionPath = filePath.slice(0, Math.max(0, dotIndex >= 0 ? dotIndex : undefined));
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
  const count = await restoreCollection(records, adminApp.firestore().collection(collectionPath));
  console.info(`Restored records: ${count}`);
}

export async function restoreCollection(
  records: Record<string, any>[],
  collection: firestore.CollectionReference
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

export function convertObjectToTimestamp(record: Record<string, any>): boolean {
  let modified = false;
  for (const [key, value] of Object.entries(record)) {
    if (value && typeof value === 'object' && !(value instanceof firestore.Timestamp)) {
      const { _nanoseconds, _seconds } = value as any;
      if (Object.keys(value).length === 2 && typeof _seconds === 'number' && typeof _nanoseconds === 'number') {
        record[key] = new firestore.Timestamp(_seconds, _nanoseconds);
        modified = true;
      } else {
        modified ||= convertObjectToTimestamp(value);
      }
    }
  }
  return modified;
}
