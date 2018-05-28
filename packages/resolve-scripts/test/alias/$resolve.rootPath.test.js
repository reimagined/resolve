import { extractEnv } from 'json-env-extract'

import alias from '../../src/core/alias/$resolve.rootPath'

describe('base config works correctly', () => {
  const resolveConfig = extractEnv(`
    {
      rootPath: ''
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

describe('base config (v2) works correctly', () => {
  const resolveConfig = extractEnv(`
    {
      rootPath: 'test'
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
