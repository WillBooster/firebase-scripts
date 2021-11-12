import { app } from 'firebase-admin';
import type { CommandModule, InferredOptionTypes } from 'yargs';

import { initializeAdmin } from './firebaseAdmin';

const builder = {
  dest: {
    description: 'A path of the destination document. If not provided, the same path as the source will be used.',
    type: 'string',
  },
  destCred: {
    description:
      'A service account file to write the destination document. If not provided, the same service account as the source will be used.',
    type: 'string',
  },
  src: {
    demandOption: true,
    description: 'A path of the source document.',
    type: 'string',
  },
  srcCred: {
    demandOption: true,
    description: 'A service account file to read the source document.',
    type: 'string',
  },
} as const;

export const copyCommand: CommandModule<unknown, InferredOptionTypes<typeof builder>> = {
  command: 'copy',
  describe: 'Copy a document',
  builder,
  async handler(argv) {
    const srcAdminApp = initializeAdmin({ name: 'src', serviceAccountPathOrObject: argv.srcCred });
    const destAdminApp = initializeAdmin({ name: 'dest', serviceAccountPathOrObject: argv.destCred ?? argv.srcCred });
    await copyDocument(srcAdminApp, argv.src, destAdminApp, argv.dest ?? argv.src);
  },
};

export async function copyDocument(
  srcAdminApp: app.App,
  srcDocumentPath: string,
  destAdminApp: app.App,
  destDocumentPath: string
): Promise<void> {
  console.info(`Reading the source document '${srcDocumentPath}'...`);
  const doc = (await srcAdminApp.firestore().doc(srcDocumentPath).get()).data();

  if (!doc) {
    console.error(`The source document '${srcDocumentPath}' does not exist.`);
    return;
  }

  console.info(`Writing the destination document '${destDocumentPath}'...'`);
  destAdminApp.firestore().doc(destDocumentPath).set(doc);
}
