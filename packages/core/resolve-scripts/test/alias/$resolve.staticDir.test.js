import declareRuntimeEnv from '../../src/declare_runtime_env'

import alias from '../../src/alias/$resolve.staticDir'
import normalizePaths from './normalize_paths'

describe('$resolve.staticDir', () => {
  test('should works correctly with base config', () => {
    const resolveConfig = { staticDir: 'staticDir' }
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
  })

  test('should not support runtime envs', () => {
    const resolveConfig = { staticDir: declareRuntimeEnv('STATIC_DIR') }
    {
      expect(() =>
        normalizePaths(
          '\r\n' +
            alias({
              resolveConfig,
              isClient: false
            }).code +
            '\r\n'
        )
      ).toThrow()
    }

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
  })
})
