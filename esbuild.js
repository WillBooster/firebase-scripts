const { builtinModules } = require('module');
const path = require('path');

const { build } = require('esbuild');
const { dtsPlugin } = require('esbuild-plugin-d.ts');

const packageJson = require(path.resolve('package.json'));

// If you want to bundle external libraries, please add them in devDependencies
const external = [...builtinModules, ...Object.keys(packageJson.dependencies ?? {})];

Promise.all([
  build({
    bundle: true,
    entryPoints: ['src/index.ts'],
    external,
    format: 'esm',
    minify: true,
    outfile: 'dist/index.min.mjs',
    platform: 'node',
    plugins: [dtsPlugin()],
    sourcemap: true,
  }),
  build({
    bundle: true,
    entryPoints: ['src/index.ts'],
    external,
    format: 'cjs',
    minify: true,
    outfile: 'dist/index.min.cjs',
    platform: 'node',
    sourcemap: true,
  }),
  build({
    bundle: true,
    entryPoints: ['src/cli.ts'],
    external,
    format: 'cjs',
    minify: true,
    outfile: 'dist/cli.min.cjs',
    platform: 'node',
    sourcemap: true,
  }),
]).then();
