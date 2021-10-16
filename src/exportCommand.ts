import fs from 'fs';
import path from 'path';

import { firestore } from 'firebase-admin';
import type { CommandModule, InferredOptionTypes } from 'yargs';

import { adminApp } from './firebaseAdmin';
import { compressJson, compressJsonText } from './jsonCompressor';

const builder = {
  directory: {
    type: 'string',
    description: 'A directory path where serialized files are generated',
    alias: 'd',
  },
  gzip: {
    type: 'boolean',
    description: 'A boolean value indicating whether gzip compressing is enabled',
    alias: 'g',
    default: false,
  },
} as const;

export const exportCommand: CommandModule<unknown, InferredOptionTypes<typeof builder>> = {
  command: 'export',
  describe: 'Export and serialize specified collections',
  builder,
  async handler(argv) {
    await exportCollections(
      argv._.map((arg) => arg.toString()),
      argv.directory ?? path.resolve(),
      argv.gzip
    );
  },
};

export async function exportCollections(collectionPaths: string[], dirPath: string, gzip?: boolean): Promise<void> {
  for (const collectionPath of collectionPaths) {
    const normalizedCollectionPath = collectionPath.replaceAll('/', '-');
    const filePath = path.join(dirPath, `${normalizedCollectionPath}.json${gzip ? '.gz' : ''}`);
    await exportCollection(collectionPath, filePath, gzip);
  }
}

export async function exportCollection(collectionPath: string, filePath: string, gzip?: boolean): Promise<string> {
  const collectionRef = adminApp.firestore().collection(collectionPath);
  console.info(`Reading ${collectionPath} collection ...`);

  const dataList: unknown[] = [];
  for await (const doc of collectionRef.stream()) {
    const typedDoc = doc as unknown as firestore.QueryDocumentSnapshot;
    dataList.push({ docId: typedDoc.id, ...typedDoc.data() });
  }
  console.info(`Read ${dataList.length} documents ...`);

  const jsonText = JSON.stringify(dataList);
  if (gzip) {
    compressJsonText(jsonText, filePath);
  } else {
    fs.writeFileSync(filePath, jsonText);
  }
  console.info(`Wrote: ${filePath}`);

  return jsonText;
}
