import yargs from 'yargs/yargs';

import { exportCollection } from './exportCollection';

async function main(): Promise<void> {
  const argv = await yargs(process.argv.slice(2))
    .command(
      'import',
      'Import serialized collection file (.json/.gz)',
      (yargs) => {
        return yargs.options({});
      },
      (argv) => {
        console.log('import', argv);
      }
    )
    .command(exportCollection)
    .help().argv;
  // console.log(argv);
}

if (typeof require !== 'undefined' && require.main === module) {
  main().then();
}
