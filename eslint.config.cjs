const nextPlugin = require('@next/eslint-plugin-next')

const coreWebVitalsRules = nextPlugin.configs['core-web-vitals'].rules

module.exports = [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...coreWebVitalsRules,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
]
