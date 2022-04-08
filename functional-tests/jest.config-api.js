const path = require('path')

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testTimeout: 60000,
  testMatch: ['**/api/**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.js$': path.resolve(__dirname, 'jest.transform.js'),
    '^.+\\.tsx?$': 'ts-jest',
  },
  roots: ['<rootDir>/api'],
}
