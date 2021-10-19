import type { Config } from '@jest/types'

process.env.TZ = 'Europe/Moscow'

const config: Config.InitialOptions = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/unit/jest-setup.ts'],
  coveragePathIgnorePatterns: ['node_modules/', 'dist/', 'coverage/'],
  unmockedModulePathPatterns: ['node_modules/react/', 'node_modules/enzyme/'],
  testMatch: ['**/test/unit/**/*.test.(j|t)s(x)?'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
}

export default config
