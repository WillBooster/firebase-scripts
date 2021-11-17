const { build } = require('esbuild');
const { dtsPlugin } = require('esbuild-plugin-d.ts');

Promise.all([
  build({
    bundle: true,
    entryPoints: ['src/index.ts'],
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
    format: 'cjs',
    minify: true,
    outfile: 'dist/index.min.cjs',
    platform: 'node',
    sourcemap: true,
  }),
  build({
    bundle: true,
    entryPoints: ['src/cli.ts'],
    minify: true,
    outfile: 'dist/cli.min.cjs',
    platform: 'node',
    sourcemap: true,
  }),
]).then();
