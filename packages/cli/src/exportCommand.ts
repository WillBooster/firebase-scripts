import path from 'path';

import { exportCollections } from '@firebase-scripts/core/src';
import { CompressionFormat } from '@firebase-scripts/core/src/jsonCompressor';
import { initializeAdmin } from '@firebase-scripts/shared/src/firebaseAdmin';
import type { CommandModule, InferredOptionTypes } from 'yargs';

export const DEFAULT_BATCH_SIZE = 1000;

const builder = {
  directory: {
    type: 'string',
    description: 'A directory path where serialized files are generated',
    alias: 'd',
  },
  format: {
    type: 'string',
    description: 'A compression format (gzip or brotil)',
    alias: 'f',
  },
  batchSize: {
    type: 'number',
    description: 'A batch size to fetch document from collection',
    default: DEFAULT_BATCH_SIZE,
    alias: 'b',
  },
} as const;

export const exportCommand: CommandModule<unknown, InferredOptionTypes<typeof builder>> = {
  command: 'export',
  describe: 'Export and serialize specified collections',
  builder,
  async handler(argv) {
    const adminApp = initializeAdmin();
    await exportCollections(
      adminApp,
      argv._.map((arg) => arg.toString()),
      argv.directory ?? path.resolve(),
      {
        format: argv.format as CompressionFormat,
        batchSize: argv.batchSize,
      }
    );
  },
};
