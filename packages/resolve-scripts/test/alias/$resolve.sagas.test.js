import path from 'path'

import alias from '../../src/core/alias/$resolve.sagas'

describe('base config works correctly', () => {
  const resolveConfig = {
    sagas: path.resolve(__dirname, 'files/testSagas.js')
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
