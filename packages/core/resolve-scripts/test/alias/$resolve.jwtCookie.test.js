import alias from '../../src/alias/$resolve.jwtCookie'
import declareRuntimeEnv from '../../src/declare_runtime_env'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    jwtCookie: {
      name: 'test-jwt',
      maxAge: 123
    }
  }

  test('[client]', () => {
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
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
            isClient: false
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
  })

  test('[server]', () => {
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig: {
              jwtCookie: {
                name: declareRuntimeEnv('name')
              }
            },
            isClient: false
          }).code +
          '\r\n'
      )
    ).toThrow()
  })
})
