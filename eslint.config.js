import pluginJs from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Enforce single quotes for strings and imports
      quotes: [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: false },
      ],
      // Enforce import sorting
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js built-ins (fs, path)
            'external', // npm modules
            'internal', // Internal modules (aliases like @app/*)
            ['parent', 'sibling', 'index'], // Relative imports
          ],
          'newlines-between': 'always', // Add a newline between groups
          alphabetize: {
            order: 'asc', // Sort imports alphabetically
            caseInsensitive: true,
          },
        },
      ],
    },
  },
];
