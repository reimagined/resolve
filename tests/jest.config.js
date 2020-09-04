process.env.TZ = 'Europe/Moscow';

const path = require('path');

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.[jt]s?(x)'],
  transform: {
    '^.+\\.js$': path.resolve(__dirname, '../jest.transform.js'),
    '^.+\\.tsx?$': 'ts-jest',
  },
};
