import { terser } from "rollup-plugin-terser";

const input = 'bin/legra.js';

export default [
  {
    input,
    output: {
      file: `lib/legra.iife.js`,
      format: 'iife',
      name: 'legra'
    },
    plugins: [terser()]
  },
  {
    input,
    output: {
      file: `lib/legra.umd.js`,
      format: 'umd',
      name: 'legra'
    },
    plugins: [terser()]
  },
  {
    input,
    output: {
      file: `lib/legra.js`,
      format: 'esm'
    },
    plugins: [terser()]
  },
];