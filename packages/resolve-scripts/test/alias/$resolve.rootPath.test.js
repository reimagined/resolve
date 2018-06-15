import { extractEnv } from 'json-env-extract'

import alias from '../../src/core/alias/$resolve.rootPath'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = extractEnv(`
    {
      rootPath: ''
    }
  `)

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

describe('base config (v2) works correctly', () => {
  const resolveConfig = extractEnv(`
    {
      rootPath: 'test'
    }
  `)

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
