import path from 'path'
import declareRuntimeEnv from '../../src/declare_runtime_env'

import alias from '../../src/alias/$resolve.subscribeAdapter'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    subscribeAdapter: {
      module: 'resolve-subscribe-socket.io',
      options: {
        url: 'http://test.test'
      }
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
  })
})

test('config with module/options and empty module failed', () => {
  const resolveConfig = {
    subscribeAdapter: {
      module: null,
      options: {
        url: declareRuntimeEnv('SUBSCRIBE_OPTIONS_URL')
      }
    }
  }

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
})

test('config with process.env failed', () => {
  const resolveConfig = {
    subscribeAdapter: {
      module: declareRuntimeEnv('SUBSCRIBE_ADAPTER'),
      options: {
        url: declareRuntimeEnv('SUBSCRIBE_OPTIONS_URL')
      }
    }
  }

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
})

test('config with process.env (v2) failed', () => {
  const resolveConfig = {
    subscribeAdapter: {
      module: path.resolve(__dirname, 'files/testAdapter.js'),
      options: {
        url: declareRuntimeEnv('SUBSCRIBE_OPTIONS_URL')
      }
    }
  }

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
})
