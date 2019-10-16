import path from 'path'
import alias from '../../src/alias/$resolve.apiHandlers'
import declareRuntimeEnv from '../../src/declare_runtime_env'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    apiHandlers: [
      {
        path: '/api/api-handler',
        method: 'get',
        controller: path.resolve(__dirname, 'files/testApiHandler.js')
      }
    ]
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

describe('config throw error when method is process.env', () => {
  const resolveConfig = {
    apiHandlers: [
      {
        path: '/api/api-handler',
        method: declareRuntimeEnv('METHOD'),
        controller: path.resolve(__dirname, 'files/testApiHandler.js')
      }
    ]
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
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: false
          }).code +
          '\r\n'
      )
    ).toThrow()
  })
})

describe('config throw error when method is process.env', () => {
  const resolveConfig = {
    apiHandlers: [
      {
        path: `/api/${declareRuntimeEnv('PATH')}`,
        method: 'get',
        controller: path.resolve(__dirname, 'files/testApiHandler.js')
      }
    ]
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
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: false
          }).code +
          '\r\n'
      )
    ).not.toThrow()
  })
})
