const path = require('path')

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testMatch: ['**/*.test.[jt]s'],
  transform: {
    '^.+\\.js$': path.resolve(__dirname, '../jest.transform.js'),
    '^.+\\.tsx?$': 'ts-jest',
  },
  verbose: true,
}
