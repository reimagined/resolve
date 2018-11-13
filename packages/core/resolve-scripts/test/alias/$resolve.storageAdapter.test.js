import path from 'path'
import declareRuntimeEnv from '../../src/declare_runtime_env'

import alias from '../../src/alias/$resolve.storageAdapter'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    storageAdapter: {
      module: path.resolve(__dirname, 'files/testAdapter.js'),
      options: {
        url: 'http://test.test'
      }
    }
  }

  test('[client]', () => {
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
})

test('config with process.env works correctly', () => {
  const resolveConfig = {
    storageAdapter: {
      module: declareRuntimeEnv('STORAGE_ADAPTER'),
      options: {
        url: declareRuntimeEnv('STORAGE_OPTIONS_URL')
      }
    }
  }

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
