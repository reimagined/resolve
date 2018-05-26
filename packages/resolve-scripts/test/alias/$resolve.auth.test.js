import path from 'path'

import alias from '../../src/core/alias/$resolve.auth'

describe('works correctly', () => {
  const resolveConfig = {
    auth: {
      strategies: path.resolve(__dirname, 'files/testStrategies.js')
    }
  }

  test('[client]', () => {
    expect(
      () =>
        '\r\n' +
        alias({
          resolveConfig,
          isClient: true
        }).code +
        '\r\n'
    ).toThrow()
  })

  test('[server]', () => {
    expect(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: false
        }).code +
        '\r\n'
    ).toMatchSnapshot()
  })
})
