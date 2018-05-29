import path from 'path'
import { extractEnv } from 'json-env-extract'

import alias from '../../src/core/alias/$resolve.subscribeAdapter'

describe('base config works correctly', () => {
  const resolveConfig = extractEnv(`
    {
      subscribeAdapter: {
        module: "${path.resolve(__dirname, 'files/testAdapter.js')}",
        options: {
          url: 'http://test.test'
        }
      }
    }
  `)

  test('[client]', () => {
    expect(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: true
        }).code +
        '\r\n'
    ).toMatchSnapshot()
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

test('config with process.env failed', () => {
  const resolveConfig = extractEnv(`
    {
      subscribeAdapter: {
        module: process.env.SUBSCRIBE_ADAPTER,
        options: {
          url: process.env.SUBSCRIBE_OPTIONS_URL
        }
      }
    }
  `)

  expect(
    () =>
      '\r\n' +
      alias({
        resolveConfig,
        isClient: false
      }).code +
      '\r\n'
  ).toThrow()
})

test('config with process.env (v2) failed', () => {
  const resolveConfig = extractEnv(`
    {
      subscribeAdapter: {
        module: "${path.resolve(__dirname, 'files/testAdapter.js')}",
        options: {
          url: process.env.SUBSCRIBE_OPTIONS_URL
        }
      }
    }
  `)

  expect(
    () =>
      '\r\n' +
      alias({
        resolveConfig,
        isClient: false
      }).code +
      '\r\n'
  ).toThrow()
})
