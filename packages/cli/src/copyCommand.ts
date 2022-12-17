import { copyDocument } from '@firebase-scripts/core/src/copy';
import { initializeAdmin } from '@firebase-scripts/shared/src/firebaseAdmin';
import type { CommandModule, InferredOptionTypes } from 'yargs';

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
    if (!argv._[1]) {
      console.error('Provide the document path to copy.');
      process.exit(1);
    }

    const source = argv._[1].toString();
    const target = argv._[2] === undefined ? source : argv._[2].toString();

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
