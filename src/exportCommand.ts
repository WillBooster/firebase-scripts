import fsp from 'fs/promises';
import path from 'path';

import { app, firestore } from 'firebase-admin';
import type { CommandModule, InferredOptionTypes } from 'yargs';

import { initializeAdmin } from './firebaseAdmin';
import { CompressionFormat, compressJsonText, getExtensionFromFormat, getFormatFromExtension } from './jsonCompressor';

export const BASE_BATCH_SIZE = 10000;

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
  batchSize: {
    type: 'number',
    description: 'A batch size to fetch document from collection',
    default: BASE_BATCH_SIZE,
    alias: 'b',
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
      {
        format: argv.format as CompressionFormat,
        batchSize: argv.batchSize,
      }
    );
  },
};

export interface OptionalParamsToExport {
  batchSize?: number;
  format?: CompressionFormat;
}

export async function exportCollections(
  adminApp: app.App,
  collectionPaths: string[],
  dirPath: string,
  params?: OptionalParamsToExport
): Promise<void> {
  const extension = getExtensionFromFormat(params?.format) ?? '';
  for (const collectionPath of collectionPaths) {
    const normalizedCollectionPath = collectionPath.replace(/\//g, '-');
    const filePath = path.join(dirPath, `${normalizedCollectionPath}.json${extension}`);
    await exportCollection(adminApp, collectionPath, filePath, params);
  }
}

export async function exportCollection(
  adminApp: app.App,
  collectionPath: string,
  filePath: string,
  params?: OptionalParamsToExport
): Promise<string> {
  const format = params?.format ?? getFormatFromExtension(filePath);
  const batchSize = params?.batchSize ?? BASE_BATCH_SIZE;

  const collectionRef = adminApp.firestore().collection(collectionPath);
  console.info(`Reading ${collectionPath} collection ...`);

  const dataList: unknown[] = [];
  let lastDocument: firestore.QueryDocumentSnapshot<firestore.DocumentData> | undefined;
  for (;;) {
    const query = lastDocument ? collectionRef.startAfter(lastDocument) : collectionRef;
    const docs = (await query.limit(batchSize).get()).docs;
    for (const doc of docs) {
      dataList.push({ docId: doc.id, ...doc.data() });
    }
    if (docs.length < batchSize) {
      break;
    }
    lastDocument = docs[docs.length - 1];
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
