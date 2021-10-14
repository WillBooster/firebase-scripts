import fs from 'fs';
import path from 'path';

import { firestore } from 'firebase-admin';
import { CommandModule } from 'yargs';

import { initializeAdmin } from './firebaseAdmin';

export const exportCommand: CommandModule = {
  command: 'export',
  describe: 'Export and serialize specified collections',
  builder: {
    gzip: {
      type: 'boolean',
      description: 'Enable gzip compressing',
      alias: 'g',
      default: false,
    },
  },
  handler: async (argv) => {
    console.log('flag', argv);

    await exportCollections([], path.resolve());
  },
};

export async function exportCollections(collectionPaths: string[], dirPath: string): Promise<void> {
  const app = initializeAdmin();

  for (const collectionPath of collectionPaths) {
    const collectionRef = app.firestore().collection(collectionPath);
    console.info(`Reading ${collectionPath} collection ...`);

    const dataList: unknown[] = [];
    for await (const doc of collectionRef.stream()) {
      const typedDoc = doc as unknown as firestore.QueryDocumentSnapshot;
      dataList.push({ docId: typedDoc.id, ...typedDoc.data() });
    }
    console.info(`Read ${dataList.length} documents ...`);

    const normalizedCollectionPath = collectionPath.replaceAll('/', '-');
    const filePath = path.join(dirPath, `${normalizedCollectionPath}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dataList));
    console.log(`Wrote: ${filePath}`);
  }
}
