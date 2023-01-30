import { hideBin } from 'yargs/helpers';

import { copyCommand } from './copyCommand';
import { exportCommand } from './exportCommand';
import { getBlobCommand } from './getBlobCommand';
import { importCommand } from './importCommand';

// https://github.com/yargs/yargs/issues/1929#issuecomment-920391458
// eslint-disable-next-line @typescript-eslint/no-var-requires, unicorn/prefer-module
const yargs = require('yargs');

export async function cli(): Promise<void> {
  await yargs(hideBin(process.argv))
    .command(copyCommand)
    .command(exportCommand)
    .command(getBlobCommand)
    .command(importCommand)
    .demandCommand()
    .help().argv;
}

cli().then();
