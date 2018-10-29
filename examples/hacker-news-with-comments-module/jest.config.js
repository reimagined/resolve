module.exports = {
  testEnvironment: 'node',
  setupFiles: ['raf/polyfill', '<rootDir>/test/unit/jest-setup.js'],
  coveragePathIgnorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    'config.app.js',
    'config.dev.js',
    'config.prod.js',
    'config.test_functional.js'
  ],
  unmockedModulePathPatterns: ['node_modules/react/', 'node_modules/enzyme/'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
}
