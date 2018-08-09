const path = require('path')

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': path.resolve(__dirname, 'jest.transform.js')
  }
}
