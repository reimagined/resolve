import alias from '../../src/core/alias/$resolve.jwtCookie'

describe('base config works correctly', () => {
  const resolveConfig = {
    jwtCookie: {
      name: 'test-jwt',
      maxAge: 123
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
