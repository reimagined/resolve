const path = require('path')

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  preset: 'jest-expo',
  setupFiles: ['raf/polyfill', '<rootDir>/jest-setup.js'],
  transform: {
    '^.+\\.js$': path.resolve(__dirname, 'jest.transform.js')
  }
  // transformIgnorePatterns: [
  //   "/node_modules/(?!react-native|native-base)/"
  // ]
}
