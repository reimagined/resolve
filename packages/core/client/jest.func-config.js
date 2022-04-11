module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.func.test.[jt]s?(x)'],
  collectCoverageFrom: ['src/**/*.[jt]s?(x)'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  roots: ['<rootDir>/src', '<rootDir>/test'],
}
