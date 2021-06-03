process.env.TZ = 'Europe/Moscow'

module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/unit/jest-setup.js'],
  coveragePathIgnorePatterns: ['node_modules/', 'dist/', 'coverage/'],
  unmockedModulePathPatterns: ['node_modules/react/', 'node_modules/enzyme/'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  }
}
