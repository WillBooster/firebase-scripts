import yargs from 'yargs/yargs';

import { downloadCommand } from './downloadCommand';
import { exportCommand } from './exportCommand';
import { importCommand } from './importCommand';

export async function main(): Promise<void> {
  await yargs(process.argv.slice(2)).command(downloadCommand).command(importCommand).command(exportCommand).help().argv;
}
