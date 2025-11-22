module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:testing-library/react',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@typescript-eslint', 'testing-library'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'warn',
    'no-useless-escape': 'warn',
    'testing-library/no-wait-for-multiple-assertions': 'warn',
    'testing-library/no-wait-for-side-effects': 'warn',
    'testing-library/no-debugging-utils': 'warn',
    'testing-library/no-dom-import': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
