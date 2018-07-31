import path from 'path'
import declareRuntimeEnv, { injectRuntimeEnv } from '../src/declare_runtime_env'

import alias from '../../src/core/alias/$resolve.busAdapter'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    busAdapter: {
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
    busAdapter: {
      module: declareRuntimeEnv('BUS_ADAPTER'),
      options: {
        url: declareRuntimeEnv('BUS_OPTIONS_URL')
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
