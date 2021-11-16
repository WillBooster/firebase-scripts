import fsp from 'fs/promises';

import type { app } from 'firebase-admin';
import type { CommandModule, InferredOptionTypes } from 'yargs';

import { initializeAdmin } from './firebaseAdmin';

const builder = {} as const;

export const getBlobCommand: CommandModule<unknown, InferredOptionTypes<typeof builder>> = {
  command: 'get-blob',
  describe: 'Download a BLOB field as a binary file',
  builder,
  async handler(argv) {
    const documentPath = argv._[1].toString();
    const fieldPath = argv._[2].toString();

    if (!documentPath) {
      console.error('Provide a slash-separated document path to download.');
      process.exit(1);
    }
    if (!fieldPath) {
      console.error('Provide a dot-separated field path to download.');
      process.exit(1);
    }

    const adminApp = initializeAdmin();

    const field = await getField(adminApp, documentPath, fieldPath);

    if (!Buffer.isBuffer(field)) {
      console.error(`The field "${fieldPath}" is not BLOB.`);
      process.exit(1);
    }

    const filename = `${documentPath}_${fieldPath}`.replace(/\W/g, '_');
    await fsp.writeFile(`${filename}.bin`, field);
  },
};

export async function getField(adminApp: app.App, documentPath: string, fieldPath: string): Promise<unknown> {
  const document = (await adminApp.firestore().doc(documentPath).get()).data();

  if (!document) {
    throw Error(`The document "${documentPath}" does not exist.`);
  }

  const splitedFieldPath = fieldPath.split('.');
  let field: unknown = document;
  for (const fieldName of splitedFieldPath) {
    if (typeof field !== 'object' || field === null || !(fieldName in field)) {
      throw Error(`The field "${fieldPath}" does not exist in the document "${documentPath}".`);
    }

    field = (field as Record<typeof fieldName, unknown>)[fieldName];
  }

  if (!field) {
    throw Error(`The field "${fieldPath}" does not exist in the document "${documentPath}".`);
  }

  return field;
}
