import path from 'path'
import { extractEnv } from 'json-env-extract'

import alias from '../../src/core/alias/$resolve.busAdapter'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = extractEnv(`
    {
      busAdapter: {
        module: "${path.resolve(__dirname, 'files/testAdapter.js')}",
        options: {
          url: 'http://test.test'
        }
      }
    }
  `)

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
  const resolveConfig = extractEnv(`
    {
      busAdapter: {
        module: process.env.BUS_ADAPTER,
        options: {
          url: process.env.BUS_OPTIONS_URL
        }
      }
    }
  `)

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
