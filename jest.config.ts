import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/app/api/',
    '/__tests__/telegram',
    '/__tests__/githubExport',
    '/__tests__/ipfs',
    '/__tests__/gist',
    '/lib/stellar\\.test\\.ts',
    '/lib/attestation\\.test\\.ts',
    '/lib/diffFindings\\.test\\.ts',
    '/lib/score\\.test\\.ts',
    '/lib/__tests__/analytics',
    '/lib/__tests__/clawbackNormalizer',
    '/lib/__tests__/groupFindings',
    '/lib/__tests__/exportTarget',
    '/lib/__tests__/apiAuth',
    '/lib/__tests__/batchScan',
    '/components/WalletConnect\\.test\\.tsx',
  ],
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', rootDir: '.' } }],
  },
}

export default config
