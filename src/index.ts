import yargs from 'yargs/yargs';

import { exportCommand } from './exportCommand';
import { importCommand } from './importCommand';

async function main(): Promise<void> {
  const argv = await yargs(process.argv.slice(2)).command(importCommand).command(exportCommand).help().argv;
  // console.log(argv);
}

if (typeof require !== 'undefined' && require.main === module) {
  main().then();
}
