module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  env: { browser: true, es2021: true, node: true },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['react', 'react-hooks', '@typescript-eslint'],
  settings: { react: { version: 'detect' } },
  rules: {}
};
