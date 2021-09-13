import declareRuntimeEnv from '../../src/declare_runtime_env'

import alias from '../../src/alias/$resolve.host'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    host: '1.2.3.4',
  }

  test('[client]', () => {
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true,
          }) +
          '\r\n'
      )
    ).toThrow()
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

describe('config with process.env works correctly', () => {
  const resolveConfig = {
    host: declareRuntimeEnv('HOST'),
  }

  test('[client]', () => {
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true,
          }) +
          '\r\n'
      )
    ).toThrow()
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
