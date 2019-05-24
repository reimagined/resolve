import declareRuntimeEnv from '../../src/declare_runtime_env'

import alias from '../../src/alias/$resolve.staticPath'
import normalizePaths from './normalize_paths'

describe('$resolve.staticPath', () => {
  test('should support runtime envs', () => {
    const resolveConfig = { staticPath: declareRuntimeEnv('STATIC_PATH') }
    {
      const result = normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )

      expect(result).toMatchSnapshot('[client - runtime]')
    }

    {
      const result = normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: false
          }).code +
          '\r\n'
      )

      expect(result).toMatchSnapshot('[server - runtime]')
    }
  })

  test('should support absolute paths', () => {
    const staticPath = 'http://resolve.dev'

    const resolveConfig = { staticPath }

    {
      const result = normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )

      expect(result).toMatchSnapshot('[client - compile-time]')

      expect(result).toContain(encodeURI(staticPath))
    }

    {
      const result = normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: false
          }).code +
          '\r\n'
      )

      expect(result).toMatchSnapshot('[server - compile-time]')

      expect(result).toContain(encodeURI(staticPath))
    }
  })

  test('should support part of URL', () => {
    const staticPath = 'static'

    const resolveConfig = { staticPath }

    {
      const result = normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )

      expect(result).toMatchSnapshot('[client - compile-time]')

      expect(result).toContain(encodeURI(staticPath))
    }

    {
      const result = normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: false
          }).code +
          '\r\n'
      )

      expect(result).toMatchSnapshot('[server - compile-time]')

      expect(result).toContain(encodeURI(staticPath))
    }
  })

  test('should not support empty URL', () => {
    const staticPath = ''

    const resolveConfig = { staticPath }

    {
      expect(() =>
        normalizePaths(
          '\r\n' +
            alias({
              resolveConfig,
              isClient: true
            }).code +
            '\r\n'
        )
      ).toThrow()
    }

    {
      const result = () =>
        normalizePaths(
          '\r\n' +
            alias({
              resolveConfig,
              isClient: false
            }).code +
            '\r\n'
        )

      expect(result).toThrow()
    }
  })

  test('should not support part of URL with leading slash', () => {
    const staticPath = '/static'

    const resolveConfig = { staticPath }

    {
      expect(() =>
        normalizePaths(
          '\r\n' +
            alias({
              resolveConfig,
              isClient: true
            }).code +
            '\r\n'
        )
      ).toThrow()
    }

    {
      const result = () =>
        normalizePaths(
          '\r\n' +
            alias({
              resolveConfig,
              isClient: false
            }).code +
            '\r\n'
        )

      expect(result).toThrow()
    }
  })

  test('should not support part of URL with trailing slash', () => {
    const staticPath = 'static/'

    const resolveConfig = { staticPath }

    {
      expect(() =>
        normalizePaths(
          '\r\n' +
            alias({
              resolveConfig,
              isClient: true
            }).code +
            '\r\n'
        )
      ).toThrow()
    }

    {
      const result = () =>
        normalizePaths(
          '\r\n' +
            alias({
              resolveConfig,
              isClient: false
            }).code +
            '\r\n'
        )

      expect(result).toThrow()
    }
  })
})
