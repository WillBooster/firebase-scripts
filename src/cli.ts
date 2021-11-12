import yargs from 'yargs/yargs';

import { copyCommand } from './copyCommand';
import { exportCommand } from './exportCommand';
import { importCommand } from './importCommand';

export async function main(): Promise<void> {
  await yargs(process.argv.slice(2)).command(importCommand).command(exportCommand).command(copyCommand).help().argv;
}
