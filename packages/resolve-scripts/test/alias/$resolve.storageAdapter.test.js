import path from 'path'
import { extractEnv } from 'json-env-extract'

import alias from '../../src/core/alias/$resolve.storageAdapter'

describe('base config works correctly', () => {
  const resolveConfig = extractEnv(`
    {
      storageAdapter: {
        module: "${path.resolve(__dirname, 'files/testAdapter.js')}",
        options: {
          url: 'http://test.test'
        }
      }
    }
  `)

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

test('config with process.env works correctly', () => {
  const resolveConfig = extractEnv(`
    {
      storageAdapter: {
        module: process.env.STORAGE_ADAPTER,
        options: {
          url: process.env.STORAGE_OPTIONS_URL
        }
      }
    }
  `)

  expect(
    '\r\n' +
      alias({
        resolveConfig,
        isClient: false
      }).code +
      '\r\n'
  ).toMatchSnapshot()
})
