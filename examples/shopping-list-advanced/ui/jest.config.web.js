const path = require('path')

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'jsdom',
  setupFiles: ['raf/polyfill', '<rootDir>/jest-setup.js'],
  transform: {
    '^.+\\.js$': path.resolve(__dirname, 'jest.transform.web.js')
  },
  snapshotSerializers: ['enzyme-to-json/serializer'],
  testMatch: ['**/?(*.)+(spec|test).js?(x)']
}
