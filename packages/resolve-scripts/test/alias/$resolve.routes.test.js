import { extractEnv } from 'json-env-extract'

import path from 'path'

import alias from '../../src/core/alias/$resolve.routes'

describe('base config works correctly', () => {
  const resolveConfig = extractEnv(`
    {
      routes: "${path.resolve(__dirname, 'files/testRoutes.js')}"
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
