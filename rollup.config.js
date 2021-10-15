import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import externals from 'rollup-plugin-node-externals';
import { terser } from 'rollup-plugin-terser';

const extensions = ['.mjs', '.js', '.json', '.ts'];
const plugins = [
  externals({ deps: true }),
  resolve({ extensions }),
  commonjs(),
  babel({ extensions, babelHelpers: 'bundled', exclude: 'node_modules/**' }),
  terser(),
];

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.min.mjs',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/index.min.js',
      format: 'commonjs',
      sourcemap: true,
    },
  ],
  plugins,
};
