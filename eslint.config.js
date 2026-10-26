const js = require('@eslint/js');
const globals = require('globals');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
  { ignores: ['**/node_modules/**', '**/.expo/**', 'docs/**', 'private/**'] },
  js.configs.recommended,
  { rules: { 'no-unused-vars': ['error', { caughtErrors: 'none' }] } },
  {
    files: ['backend/**/*.js', '*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['frontend/**/*.js'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, ...globals.es2021, __DEV__: 'readonly' },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Loading data on mount (fetch, then setState) is the pattern this app uses everywhere.
      'react-hooks/set-state-in-effect': 'off',
      // Reanimated shared values are mutated through `.value` by design.
      'react-hooks/immutability': 'off',
    },
  },
];
