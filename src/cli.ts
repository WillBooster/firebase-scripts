import { exportCommand } from './exportCommand';
import { getBlobCommand } from './getBlobCommand';
import { importCommand } from './importCommand';

// https://github.com/yargs/yargs/issues/1929#issuecomment-920391458
// eslint-disable-next-line @typescript-eslint/no-var-requires
const yargs = require('yargs');

export async function main(): Promise<void> {
  await yargs(process.argv.slice(2)).command(getBlobCommand).command(importCommand).command(exportCommand).help().argv;
}
