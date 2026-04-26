import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@nextgentra/ui/(.*)$': '<rootDir>/../packages/ui/$1',
    '^@nextgentra/utils/(.*)$': '<rootDir>/../packages/utils/$1',
    '^@nextgentra/config/(.*)$': '<rootDir>/../packages/config/$1',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
}

export default createJestConfig(customJestConfig)
