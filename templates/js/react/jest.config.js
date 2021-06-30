'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const config = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['node_modules/', 'dist/', 'coverage/'],
  unmockedModulePathPatterns: ['node_modules/react/', 'node_modules/enzyme/'],
  testMatch: ['**/test/unit/**/*.test.(j|t)s(x)?'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
}
exports.default = config
