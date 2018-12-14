const path = require('path')

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  preset: 'jest-expo',
  setupFiles: ['raf/polyfill', '<rootDir>/jest-setup.js'],
  transform: {
    '^.+\\.js$': path.resolve(__dirname, 'jest.transform.native.js')
  },
  snapshotSerializers: ['enzyme-to-json/serializer'],
  testMatch: ['**/?(*.)+(spec|test).native.js?(x)']
}
