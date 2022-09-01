import fsp from 'fs/promises';

import type { app } from 'firebase-admin';

export async function downloadBlobToFile(
  adminApp: app.App,
  documentPath: string | undefined,
  fieldPath: string | undefined,
  outputFilePath: string
): Promise<void> {
  if (!documentPath) {
    throw Error('Provide a slash-separated document path to download.');
  }
  if (!fieldPath) {
    throw Error('Provide a dot-separated field path to download.');
  }

  const field = await getField(adminApp, documentPath, fieldPath);

  if (!Buffer.isBuffer(field)) {
    throw Error(`The field "${fieldPath}" is not BLOB.`);
  }

  await fsp.writeFile(outputFilePath, field);
}

async function getField(adminApp: app.App, documentPath: string, fieldPath: string): Promise<unknown> {
  const document = (await adminApp.firestore().doc(documentPath).get()).data();

  if (!document) {
    throw Error(`The document "${documentPath}" does not exist.`);
  }

  const splitFieldPath = fieldPath.split('.');
  let field = document;
  for (const fieldName of splitFieldPath) {
    field = field?.[fieldName];
  }
  if (!field) {
    throw Error(`The field "${fieldPath}" does not exist in the document "${documentPath}".`);
  }

  return field;
}
