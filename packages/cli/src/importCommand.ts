import { importCollection } from '@firebase-scripts/core/src';
import { initializeAdmin } from '@firebase-scripts/shared/src/firebaseAdmin';
import type { CommandModule, InferredOptionTypes } from 'yargs';

const builder = {
  collection: {
    type: 'array',
    description: 'A collection path where a serialized file is imported',
    alias: 'c',
  },
} as const;

export const importCommand: CommandModule<unknown, InferredOptionTypes<typeof builder>> = {
  command: 'import',
  describe: 'Import serialized collection files (.json/.gz/.br)',
  builder,
  async handler(argv) {
    if (!argv._.length) {
      console.error('Please pass at least one of serialized collection files.');
      process.exit(1);
    }
    if (argv.collection?.length && argv._.length !== argv.collection.length) {
      console.error('The numbers of serialized files and collection paths must be equal.');
      process.exit(1);
    }

    const adminApp = initializeAdmin();
    for (let i = 0; i < argv._.length; i++) {
      await importCollection(adminApp, argv._[i].toString(), argv.collection?.[i].toString());
    }
  },
};
