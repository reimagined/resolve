const path = require('path')

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/*.test.js'],
  transform: {
    '^.+\\.js$': path.resolve(__dirname, 'jest.transform.js')
  }
}
