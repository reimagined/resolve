module.exports = {
  testEnvironment: 'node',
  transform: {
    '\\.js$': '<rootDir>/test/unit/config/jest-js-transform',
    '\\.css$': '<rootDir>/test/unit/config/jest-css-modules-transform'
  }
}
