// Same style as website-astro
/** @type {import("prettier").Config} */
const config = {
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'es5',
  plugins: ['prettier-plugin-svelte'],
  overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
};

export default config;
