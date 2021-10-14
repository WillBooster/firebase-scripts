import fs from 'fs';

import { firestore } from 'firebase-admin';
import { PromisePool } from 'minimal-promise-pool';
import { CommandModule } from 'yargs';

import { initializeAdmin } from './firebaseAdmin';

export const importCommand: CommandModule = {
  command: 'import',
  describe: 'Import serialized collection files (.json/.gz)',
  builder: {
    flag: {
      type: 'boolean',
      description: 'Boolean Flag',
      alias: 'f',
      default: false,
    },
  },
  handler: async (argv) => {
    console.log('flag', argv);

    await importCollections('');
  },
};

export async function importCollections(filePath: string, collectionPath?: string): Promise<void> {
  const app = initializeAdmin();
  if (!collectionPath) {
    const dotIndex = filePath.indexOf('.');
    collectionPath = filePath.substr(0, dotIndex >= 0 ? dotIndex : undefined);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`${filePath} does not exist.`);
    return;
  }
  const records = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(records)) {
    console.error(`${filePath} is not valid json.`);
    return;
  }

  console.log(`Start restoring: ${collectionPath}`);
  const count = await restoreCollection(records, app.firestore().collection(collectionPath));
  console.log(`Restored records: ${count}`);
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
    await promisePool.run(() => collection.doc(docId).set(record));
    count++;
    if (count % 1000 === 0) {
      console.log(`${count} / ${records.length}`);
    }
  }
  await promisePool.promiseAll();
  console.log(`${count} / ${records.length}`);
  console.log(`Done (${records.length - count} records are skipped due to the lack of 'docId' filed)`);
  return count;
}
