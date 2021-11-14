import { app } from 'firebase-admin';
import type { CommandModule, InferredOptionTypes } from 'yargs';

import { initializeAdmin } from './firebaseAdmin';

const builder = {
  'source-service-account-path': {
    demandOption: true,
    description: 'A service account file to read the source document.',
    type: 'string',
  },
  'target-service-account-path': {
    description:
      'A service account file to write the target document. If not provided, the same service account as the source will be used.',
    type: 'string',
  },
} as const;

export const copyCommand: CommandModule<unknown, InferredOptionTypes<typeof builder>> = {
  command: 'copy',
  describe: 'Copy a document',
  builder,
  async handler(argv) {
    if (argv._.length < 1) {
      console.error('Provide the document path to copy.');
      process.exit(1);
    }

    const source = argv._[0].toString();
    const target = argv._[1] !== undefined ? argv._[1].toString() : source;

    const srcAdminApp = initializeAdmin({
      name: 'source',
      serviceAccountPathOrObject: argv['source-service-account-path'],
    });

    const destAdminApp = initializeAdmin({
      name: 'dest',
      serviceAccountPathOrObject: argv['target-service-account-path'] ?? argv['source-service-account-path'],
    });

    await copyDocument(srcAdminApp, source, destAdminApp, target);
  },
};

export async function copyDocument(
  sourceAdminApp: app.App,
  sourceDocumentPath: string,
  targetAdminApp: app.App,
  targetDocumentPath: string
): Promise<void> {
  console.info(`Reading the source document '${sourceDocumentPath}'...`);
  const doc = (await sourceAdminApp.firestore().doc(sourceDocumentPath).get()).data();

  if (!doc) {
    console.error(`The source document '${sourceDocumentPath}' does not exist.`);
    return;
  }

  console.info(`Writing the target document '${targetDocumentPath}'...'`);
  targetAdminApp.firestore().doc(targetDocumentPath).set(doc);
}
