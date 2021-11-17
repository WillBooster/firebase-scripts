import fsp from 'fs/promises';

import type { app } from 'firebase-admin';
import type { CommandModule, InferredOptionTypes } from 'yargs';

import { initializeAdmin } from './firebaseAdmin';

const builder = {
  output: {
    alias: 'o',
    demandOption: true,
    description: 'An output file path',
    type: 'string',
  },
} as const;

export const getBlobCommand: CommandModule<unknown, InferredOptionTypes<typeof builder>> = {
  command: 'get-blob',
  describe: 'Download a BLOB field as a binary file',
  builder,
  async handler(argv) {
    const adminApp = initializeAdmin();

    const documentPath = argv._[1].toString();
    const fieldPath = argv._[2].toString();

    await getBlobCommandHandler(adminApp, documentPath, fieldPath, argv.output);
  },
};

export async function getBlobCommandHandler(
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
