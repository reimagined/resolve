import { extractEnv } from 'json-env-extract'

import alias from '../../src/core/alias/$resolve.port'

describe('base config works correctly', () => {
  const resolveConfig = {
    port: 1234
  }

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

describe('config with process.env works correctly', () => {
  const resolveConfig = extractEnv(`{
    port: process.env.PORT
  }`)

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
