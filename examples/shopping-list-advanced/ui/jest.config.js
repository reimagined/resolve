const path = require('path')

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  setupFiles: ['raf/polyfill', '<rootDir>/jest-setup.js'],
  transform: {
    '^.+\\.js$': path.resolve(__dirname, 'jest.transform.js')
  },
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|svg)$': '<rootDir>/test/unit/img-mock.js'
  }
}
