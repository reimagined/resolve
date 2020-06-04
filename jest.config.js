const path = require('path')

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testMatch: ['**/test/**/import-export-sample/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  transform: {
    '^.+\\.js$': path.resolve(__dirname, 'jest.transform.js')
  }
}
