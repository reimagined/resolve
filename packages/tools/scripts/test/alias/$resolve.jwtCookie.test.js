import alias from '../../src/alias/$resolve.jwtCookie'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    jwtCookie: {
      name: 'test-jwt',
      maxAge: 123,
    },
  }

  test('[client]', () => {
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true,
          }) +
          '\r\n'
      )
    ).toMatchSnapshot()
  })

  test('[server]', () => {
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: false,
          }) +
          '\r\n'
      )
    ).toMatchSnapshot()
  })
})
