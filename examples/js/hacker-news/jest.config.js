'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
process.env.TZ = 'Europe/Moscow'
const config = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/unit/jest-setup.js'],
  coveragePathIgnorePatterns: ['node_modules/', 'dist/', 'coverage/'],
  unmockedModulePathPatterns: ['node_modules/react/', 'node_modules/enzyme/'],
  testMatch: ['**/test/unit/**/*.test.(j|t)s(x)?'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
}
exports.default = config
