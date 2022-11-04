import fsp from 'node:fs/promises';

import { App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function downloadBlobToFile(
  adminApp: App,
  documentPath: string | undefined,
  fieldPath: string | undefined,
  outputFilePath: string
): Promise<void> {
  if (!documentPath) {
    throw new Error('Provide a slash-separated document path to download.');
  }
  if (!fieldPath) {
    throw new Error('Provide a dot-separated field path to download.');
  }

  const field = await getField(adminApp, documentPath, fieldPath);

  if (!Buffer.isBuffer(field)) {
    throw new TypeError(`The field "${fieldPath}" is not BLOB.`);
  }

  await fsp.writeFile(outputFilePath, field);
}

async function getField(adminApp: App, documentPath: string, fieldPath: string): Promise<unknown> {
  const docSnapshot = await getFirestore(adminApp).doc(documentPath).get();
  const docData = docSnapshot.data();
  if (!docData) {
    throw new Error(`The document "${documentPath}" does not exist.`);
  }

  const splitFieldPath = fieldPath.split('.');
  let field = docData;
  for (const fieldName of splitFieldPath) {
    field = field?.[fieldName];
  }
  if (!field) {
    throw new Error(`The field "${fieldPath}" does not exist in the document "${documentPath}".`);
  }
  return field;
}
