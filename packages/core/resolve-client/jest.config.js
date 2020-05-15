process.env.TZ = 'Europe/Moscow'

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[jt]sx?$': 'ts-jest'
  },
  testMatch: ['**/test/**/*.test.[jt]s?(x)'],
  roots: ['<rootDir>']
}
