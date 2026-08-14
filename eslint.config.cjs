const nextPlugin = require('@next/eslint-plugin-next')
const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const {
  noDangerouslySetInnerHTML,
  noRawInnerHtml,
} = require('./eslint-rules/no-raw-html.cjs')

const coreWebVitalsRules = nextPlugin.configs['core-web-vitals'].rules ?? {}

module.exports = [
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
      '@typescript-eslint': tsPlugin,
      'no-raw-html': { rules: { 'no-dangerously-set-inner-html': noDangerouslySetInnerHTML, 'no-raw-inner-html': noRawInnerHtml } },
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...coreWebVitalsRules,
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      'prefer-const': 'warn',
      'no-raw-html/no-dangerously-set-inner-html': 'warn',
      'no-raw-html/no-raw-inner-html': 'error',
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**'],
    rules: {
      'no-raw-html/no-raw-inner-html': 'off',
    },
  },
]
