const path = require('path')

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  preset: 'jest-expo',
  setupFiles: ['raf/polyfill', '<rootDir>/jest-setup.js'],
  transform: {
    '^.+\\.js$': path.resolve(__dirname, 'jest.transform.js')
  },
  snapshotSerializers: ['enzyme-to-json/serializer'],
  testMatch: ['**/?(*.)+(spec|test).js?(x)']
}
