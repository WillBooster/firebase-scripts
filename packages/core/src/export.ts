import fsp from 'node:fs/promises';
import path from 'node:path';

import { App } from 'firebase-admin/app';
import { DocumentData, getFirestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { CompressionFormat, compressJsonText, getExtensionFromFormat, getFormatFromExtension } from './jsonCompressor';

export const DEFAULT_BATCH_SIZE = 1000;

export interface ExportOptions {
  batchSize?: number;
  format?: CompressionFormat;
}

export async function exportCollections(
  adminApp: App,
  collectionPaths: string[],
  dirPath: string,
  params?: ExportOptions
): Promise<void> {
  const extension = getExtensionFromFormat(params?.format) ?? '';
  for (const collectionPath of collectionPaths) {
    const normalizedCollectionPath = collectionPath.replace(/\//g, '-');
    const filePath = path.join(dirPath, `${normalizedCollectionPath}.json${extension}`);
    await exportCollection(adminApp, collectionPath, filePath, params);
  }
}

export async function exportCollection(
  adminApp: App,
  collectionPath: string,
  filePath: string,
  params?: ExportOptions
): Promise<string> {
  const format = params?.format ?? getFormatFromExtension(filePath);
  const batchSize = params?.batchSize ?? DEFAULT_BATCH_SIZE;

  const collectionRef = getFirestore(adminApp).collection(collectionPath);
  console.info(`Reading ${collectionPath} collection ...`);

  const dataList: unknown[] = [];
  let lastDocument: QueryDocumentSnapshot<DocumentData> | undefined;
  for (;;) {
    const query = lastDocument ? collectionRef.startAfter(lastDocument) : collectionRef;
    const { docs } = await query.limit(batchSize).get();
    for (const doc of docs) {
      dataList.push({ docId: doc.id, ...doc.data() });
    }
    process.stdout.write('.');
    if (docs.length < batchSize) {
      break;
    }
    lastDocument = docs[docs.length - 1];
  }
  console.info(`Read ${dataList.length} documents ...`);

  const jsonText = JSON.stringify(dataList);
  await (format ? compressJsonText(jsonText, filePath, format) : fsp.writeFile(filePath, jsonText));
  console.info(`Wrote ${filePath}`);

  return jsonText;
}
