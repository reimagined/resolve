module.exports = {
  testEnvironment: 'node',
  setupFiles: ['raf/polyfill', '<rootDir>/test/unit/jest-setup.js'],
  coveragePathIgnorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    'resolve.build.config.js',
    'resolve.client.config.js',
    'resolve.server.config.js'
  ],
  unmockedModulePathPatterns: ['node_modules/react/', 'node_modules/enzyme/']
}
