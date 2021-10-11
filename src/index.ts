import yargs from 'yargs/yargs';

async function main(): Promise<void> {
  await yargs(process.argv.slice(2))
    .command('export', 'Export and serialize specified collections',(yargs) => {
      return yargs;
    }, (argv) => {
    })
    .command('import', 'Import serialized collection file (.json/.gz)',(yargs) => {
      return yargs.options({

      });
    }, (argv) => {

    });
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}


