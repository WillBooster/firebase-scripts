import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import externals from 'rollup-plugin-node-externals';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';

const extensions = ['.mjs', '.js', '.json', '.ts'];
const plugins = [
  externals({ deps: true }),
  resolve({ extensions }),
  commonjs(),
  babel({ extensions, babelHelpers: 'bundled', exclude: 'node_modules/**' }),
  terser(),
];

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.min.mjs',
        format: 'es',
        sourcemap: true,
      },
      {
        file: 'dist/index.min.cjs',
        format: 'commonjs',
        sourcemap: true,
      },
    ],
    plugins,
  },
  {
    input: 'src/cli.ts',
    output: {
      file: 'dist/cli.min.cjs',
      format: 'commonjs',
      sourcemap: true,
    },
    plugins,
  },
  {
    input: './dist/src/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
];
