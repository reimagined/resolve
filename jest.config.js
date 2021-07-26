process.env.TZ = 'Europe/Moscow'

const path = require('path')

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '^.*/test/func/.*$',
    '^.*/test/functional/.*$',
    '^.*/test/.*\\.func\\.test\\.[jt]sx?$',
  ],
  collectCoverageFrom: ['src/**/*.js', 'src/**/*.ts'],
  transform: {
    '^.+\\.js$': path.resolve(__dirname, 'jest.transform.js'),
    '^.+\\.tsx?$': 'ts-jest',
  },
  roots: ['<rootDir>/src', '<rootDir>/test'],
}
