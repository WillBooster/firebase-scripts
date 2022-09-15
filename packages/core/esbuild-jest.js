const { builtinModules } = require('module');

const rootPackageJson = require('../../package.json');
const packageJson = require('./package.json');

const external = [
  ...builtinModules,
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.devDependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
].filter((module) => !module.startsWith(`@${rootPackageJson.name}/`));

module.exports = {
  getCacheKey() {
    // TODO: implement
    return (Math.random() * 10000000).toString();
  },
  process(_, filename) {
    const outputFiles = buildCode(filename);
    return {
      code: outputFiles.find(({ path }) => !path.endsWith('.map')).text,
      map: outputFiles.find(({ path }) => path.endsWith('.map')).text,
    };
  },
};

function buildCode(filename) {
  const { buildSync } = require('esbuild');
  const { outputFiles } = buildSync({
    bundle: true,
    entryPoints: [filename],
    external,
    minify: false,
    outdir: './dist',
    platform: 'node',
    sourcemap: true,
    write: false,
  });
  // Try cleaning-up workers in esbuild
  delete require.cache[require.resolve('esbuild')];
  return outputFiles;
}
