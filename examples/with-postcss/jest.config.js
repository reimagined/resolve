process.env.TZ = 'Europe/Moscow'

module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^.+\\.css': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
}
