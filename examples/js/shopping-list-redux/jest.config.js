process.env.TZ = 'Europe/Moscow'
const config = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['node_modules/', 'dist/', 'coverage/'],
  unmockedModulePathPatterns: ['node_modules/react/', 'node_modules/enzyme/'],
  testMatch: ['**/test/unit/**/*.test.ts'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
}
export default config
