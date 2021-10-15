import fs from 'fs';

import { firestore } from 'firebase-admin';
import { PromisePool } from 'minimal-promise-pool';
import { CommandModule, InferredOptionTypes } from 'yargs';

import { adminApp } from './firebaseAdmin';
import { decompressJson } from './jsonCompressor';

const builder = {
  collection: {
    type: 'array',
    description: 'A collection path where a serialized file is imported',
    alias: 'c',
  },
} as const;

export const importCommand: CommandModule<unknown, InferredOptionTypes<typeof builder>> = {
  command: 'import',
  describe: 'Import serialized collection files (.json/.gz)',
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

    for (let i = 0; i < argv._.length; i++) {
      await importCollection(argv._[i].toString(), argv.collection?.[i].toString());
    }
  },
};

export async function importCollection(filePath: string, collectionPath?: string): Promise<void> {
  if (!collectionPath) {
    const dotIndex = filePath.indexOf('.');
    collectionPath = filePath.substr(0, dotIndex >= 0 ? dotIndex : undefined);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`${filePath} does not exist.`);
    return;
  }

  const records = filePath.endsWith('.json.gz')
    ? decompressJson(filePath)
    : JSON.parse(fs.readFileSync(filePath, 'utf8'));
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

    restoreTimestamp(record);

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

export function restoreTimestamp<T>(record: T): T {
  for (const [key, value] of Object.entries(record) as [string, any]) {
    if (value && typeof value === 'object') {
      if (
        Object.keys(value).length === 2 &&
        typeof value['_nanoseconds'] === 'number' &&
        typeof value['_seconds'] === 'number'
      ) {
        (record as any)[key] = new firestore.Timestamp(value['_seconds'], value['_nanoseconds']);
      } else {
        restoreTimestamp(value);
      }
    }
  }
  return record;
}
