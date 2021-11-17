const { buildSync } = require('esbuild');
const { builtinModules } = require('module');
const path = require('path');

const package = require(path.resolve('package.json'));

const external = [
  ...builtinModules,
  ...Object.keys(package.dependencies ?? {}),
  ...Object.keys(package.devDependencies ?? {}),
  ...Object.keys(package.peerDependencies ?? {}),
];

module.exports = {
  process(_, filename) {
    const { outputFiles } = buildSync({
      bundle: true,
      entryPoints: [filename],
      external,
      minify: false,
      outdir: './dist',
      sourcemap: true,
      write: false,
    });

    return {
      code: outputFiles.find(({ path }) => !path.endsWith('.map')).text,
      map: outputFiles.find(({ path }) => path.endsWith('.map')).text,
    };
  },
};
