import { extractEnv } from 'json-env-extract'

import alias from '../../src/core/alias/$resolve.jwtCookie'

describe('base config works correctly', () => {
  const resolveConfig = extractEnv(`
    {
      jwtCookie: {
        name: 'test-jwt',
        maxAge: 123
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
