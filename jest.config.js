const path = require('path')

process.env.MODULE_TYPE = 'cjs'
process.env.MODULE_TARGET = 'server'

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  transform: {
    '^.+\\.js$': path.resolve(__dirname, 'jest.transform.js')
  }
}
