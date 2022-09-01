import { downloadBlobToFile } from '@firebase-scripts/core/src/blob';
import { initializeAdmin } from '@firebase-scripts/shared/src/firebaseAdmin';
import type { CommandModule, InferredOptionTypes } from 'yargs';

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

    await downloadBlobToFile(adminApp, documentPath, fieldPath, argv.output);
  },
};
