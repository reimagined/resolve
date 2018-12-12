import declareRuntimeEnv from '../../src/declare_runtime_env'

import alias from '../../src/alias/$resolve.rootPath'
import normalizePaths from './normalize_paths'

describe('$resolve.rootPath', () => {
  test('should support runtime envs', () => {
    const resolveConfig = { rootPath: declareRuntimeEnv('ROOT_PATH') }
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

  test('should support part of URL', () => {
    const rootPath = 'rootPath'

    const resolveConfig = { rootPath }

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

      expect(result).toContain(encodeURI(rootPath))
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

      expect(result).toContain(encodeURI(rootPath))
    }
  })

  test('should support empty URL', () => {
    const rootPath = ''

    const resolveConfig = { rootPath }

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

      expect(result).toContain(encodeURI(rootPath))
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

      expect(result).toContain(encodeURI(rootPath))
    }
  })

  test('should not support absolute URL', () => {
    const rootPath = 'http://resolve.dev'

    const resolveConfig = { rootPath }

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
    const rootPath = '/rootPath'

    const resolveConfig = { rootPath }

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
    const rootPath = 'rootPath/'

    const resolveConfig = { rootPath }

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
