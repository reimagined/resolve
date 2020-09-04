process.env.TZ = 'Europe/Moscow'

const path = require('path')

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.func.test.[jt]s?(x)'],
  collectCoverageFrom: ['src/**/*.js'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  roots: ['<rootDir>/src', '<rootDir>/test'],
}
