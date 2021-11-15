import fsp from 'fs/promises';

import { app } from 'firebase-admin';
import type { CommandModule, InferredOptionTypes } from 'yargs';

import { initializeAdmin } from './firebaseAdmin';

const builder = {} as const;

export const downloadCommand: CommandModule<unknown, InferredOptionTypes<typeof builder>> = {
  command: 'download',
  describe: 'Download a resource',
  builder,
  async handler(argv) {
    if (argv._.length < 2) {
      console.error('Provide a resource path to download.');
      process.exit(1);
    }

    const resourcePath = argv._[1].toString();

    const adminApp = initializeAdmin();

    await downloadDocument(adminApp, resourcePath);
  },
};

export async function downloadDocument(adminApp: app.App, resourcePath: string): Promise<void> {
  const splitedPath = resourcePath.split('/');

  if (splitedPath.length < 2) {
    console.error(`Downloading a collection is not supported.`);
    return;
  }

  const isDocumentPath = splitedPath.length % 2 === 0;
  const documentPath = isDocumentPath ? resourcePath : splitedPath.slice(0, -1).join('/');

  console.info(`Reading the document "${documentPath}"...`);
  const document = (await adminApp.firestore().doc(documentPath).get()).data();

  if (!document) {
    console.error(`The document "${documentPath}" does not exist.`);
    return;
  }

  const filename = resourcePath.replace(/\W/g, '_');

  if (isDocumentPath) {
    console.info(`Writing the document "${resourcePath}" to a file...'`);
    await fsp.writeFile(`${filename}.json`, JSON.stringify(document));
  } else {
    const fieldName = splitedPath[splitedPath.length - 1];
    const field = document[fieldName];

    if (!field) {
      console.error(`The field "${fieldName}" does not exist.`);
      return;
    }

    if (Buffer.isBuffer(field)) {
      await fsp.writeFile(`${filename}.bin`, field);
    } else {
      await fsp.writeFile(`${filename}.txt`, field);
    }
  }
}
