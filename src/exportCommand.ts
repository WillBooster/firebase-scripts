import fsp from 'fs/promises';
import path from 'path';

import { app, firestore } from 'firebase-admin';
import type { CommandModule, InferredOptionTypes } from 'yargs';

import { initializeAdmin } from './firebaseAdmin';
import { CompressionFormat, compressJsonText, getExtensionFromFormat } from './jsonCompressor';

const builder = {
  directory: {
    type: 'string',
    description: 'A directory path where serialized files are generated',
    alias: 'd',
  },
  format: {
    type: 'string',
    description: 'A compression format (gzip or brotil)',
    alias: 'f',
  },
} as const;

export const exportCommand: CommandModule<unknown, InferredOptionTypes<typeof builder>> = {
  command: 'export',
  describe: 'Export and serialize specified collections',
  builder,
  async handler(argv) {
    const adminApp = initializeAdmin();
    await exportCollections(
      adminApp,
      argv._.map((arg) => arg.toString()),
      argv.directory ?? path.resolve(),
      argv.format as CompressionFormat
    );
  },
};

export async function exportCollections(
  adminApp: app.App,
  collectionPaths: string[],
  dirPath: string,
  format?: CompressionFormat
): Promise<void> {
  const extension = getExtensionFromFormat(format) ?? '';
  for (const collectionPath of collectionPaths) {
    const normalizedCollectionPath = collectionPath.replaceAll('/', '-');
    const filePath = path.join(dirPath, `${normalizedCollectionPath}.json${extension}`);
    await exportCollection(adminApp, collectionPath, filePath, format);
  }
}

export async function exportCollection(
  adminApp: app.App,
  collectionPath: string,
  filePath: string,
  format?: CompressionFormat
): Promise<string> {
  const collectionRef = adminApp.firestore().collection(collectionPath);
  console.info(`Reading ${collectionPath} collection ...`);

  const dataList: unknown[] = [];
  for await (const doc of collectionRef.stream()) {
    const typedDoc = doc as unknown as firestore.QueryDocumentSnapshot;
    dataList.push({ docId: typedDoc.id, ...typedDoc.data() });
  }
  console.info(`Read ${dataList.length} documents ...`);

  const jsonText = JSON.stringify(dataList);
  if (format) {
    await compressJsonText(jsonText, filePath, format);
  } else {
    await fsp.writeFile(filePath, jsonText);
  }
  console.info(`Wrote: ${filePath}`);

  return jsonText;
}
