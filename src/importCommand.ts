import fs from 'fs';
import fsp from 'fs/promises';

import { app, firestore } from 'firebase-admin';
import { PromisePool } from 'minimal-promise-pool';
import type { CommandModule, InferredOptionTypes } from 'yargs';

import { initializeAdmin } from './firebaseAdmin';
import { decompressJsonText, getFormatFromExtension, reviverForJsonParse } from './jsonCompressor';

const builder = {
  collection: {
    type: 'array',
    description: 'A collection path where a serialized file is imported',
    alias: 'c',
  },
} as const;

export const importCommand: CommandModule<unknown, InferredOptionTypes<typeof builder>> = {
  command: 'import',
  describe: 'Import serialized collection files (.json/.gz/.br)',
  builder,
  async handler(argv) {
    if (!argv._.length) {
      console.error('Please pass at least one of serialized collection files.');
      process.exit(1);
    }
    if (argv.collection?.length && argv._.length !== argv.collection.length) {
      console.error('The numbers of serialized files and collection paths must be equal.');
      process.exit(1);
    }

    const adminApp = initializeAdmin();
    for (let i = 0; i < argv._.length; i++) {
      await importCollection(adminApp, argv._[i].toString(), argv.collection?.[i].toString());
    }
  },
};

export async function importCollection(adminApp: app.App, filePath: string, collectionPath?: string): Promise<void> {
  if (!collectionPath) {
    const dotIndex = filePath.indexOf('.');
    collectionPath = filePath.substring(0, dotIndex >= 0 ? dotIndex : undefined);
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
  const promisePool = new PromisePool(10);
  for (const record of records) {
    if (!record.docId) continue;

    const docId = record.docId;
    delete record.docId;

    convertObjectToTimestamp(record);

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
      const { _seconds, _nanoseconds } = value as any;
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
