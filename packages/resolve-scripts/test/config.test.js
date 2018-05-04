import path from 'path'

import exec from './exec'
import validateСonfig from '../src/core/validate_config'

const resolveConfigOrigin = require('../configs/resolve.config.json')

describe('validate schema', () => {
  it('empty', () => {
    expect(validateСonfig(resolveConfigOrigin)).toBeTruthy()
  })

  it('custom storage adapter', () => {
    expect(
      validateСonfig({
        ...resolveConfigOrigin,
        storage: {
          adapter: 'resolve-storage-mongo',
          options: {
            collectionName: 'MyEvents'
          }
        }
      })
    ).toBeTruthy()
  })

  it('custom bus adapter', () => {
    expect(
      validateСonfig({
        ...resolveConfigOrigin,
        storage: {
          adapter: 'resolve-bus-rabbitmq',
          options: {}
        }
      })
    ).toBeTruthy()
  })

  it('custom subscribe adapter', () => {
    expect(
      validateСonfig({
        ...resolveConfigOrigin,
        subscribe: {
          adapter: 'resolve-subscribe-mqtt',
          options: {}
        }
      })
    ).toBeTruthy()
  })

  it('custom root path', () => {
    expect(
      validateСonfig({
        ...resolveConfigOrigin,
        rootPath: 'my-app'
      })
    ).toBeTruthy()
  })

  it('custom static path', () => {
    expect(
      validateСonfig({
        ...resolveConfigOrigin,
        staticPath: 'https://my-cdn'
      })
    ).toBeTruthy()
  })

  it('custom routes path', () => {
    expect(
      validateСonfig({
        ...resolveConfigOrigin,
        routes: 'src/client/entryPoint.js'
      })
    ).toBeTruthy()
  })

  it('custom index path', () => {
    expect(
      validateСonfig({
        ...resolveConfigOrigin,
        index: 'src/client/index.js'
      })
    ).toBeTruthy()
  })

  it('custom aggregates dir', () => {
    expect(
      validateСonfig({
        ...resolveConfigOrigin,
        aggregates: 'my-aggregates'
      })
    ).toBeTruthy()
  })

  it('custom view models dir', () => {
    expect(
      validateСonfig({
        ...resolveConfigOrigin,
        viewModels: 'my-view-models'
      })
    ).toBeTruthy()
  })

  it('custom read models dir', () => {
    expect(
      validateСonfig({
        ...resolveConfigOrigin,
        readModels: 'my-read-models'
      })
    ).toBeTruthy()
  })

  it('custom static dir', () => {
    expect(
      validateСonfig({
        ...resolveConfigOrigin,
        staticDir: 'my-static-dir'
      })
    ).toBeTruthy()
  })

  it('custom auth', () => {
    expect(
      validateСonfig({
        ...resolveConfigOrigin,
        auth: {
          strategies: 'custom-auth/index.js'
        }
      })
    ).toBeTruthy()
  })

  it('custom jwt', () => {
    expect(
      validateСonfig({
        ...resolveConfigOrigin,
        jwtCookie: {
          name: 'authToken',
          maxAge: 1000 * 60 * 60 * 24 * 365
        }
      })
    ).toBeTruthy()
  })

  it('custom env', () => {
    expect(
      validateСonfig({
        ...resolveConfigOrigin,
        subscribe: {
          adapter: 'resolve-subscribe-socket-io',
          options: {}
        },
        env: {
          production: {
            subscribe: {
              adapter: 'resolve-subscribe-mqtt',
              options: {}
            }
          }
        }
      })
    ).toBeTruthy()
  })
})

describe('validate schema (fail)', () => {
  it('incorrect storage adapter', () => {
    expect(() =>
      validateСonfig({
        ...resolveConfigOrigin,
        storage: {
          adapter: 123,
          options: {
            collectionName: 'MyEvents'
          }
        }
      })
    ).toThrow()
  })

  it('incorrect bus adapter', () => {
    expect(() =>
      validateСonfig({
        ...resolveConfigOrigin,
        storage: {
          adapter: 123,
          options: {}
        }
      })
    ).toThrow()
  })

  it('incorrect subscribe adapter', () => {
    expect(() =>
      validateСonfig({
        ...resolveConfigOrigin,
        subscribe: {
          adapter: 123,
          options: {}
        }
      })
    ).toThrow()
  })

  it('incorrect root path', () => {
    expect(() =>
      validateСonfig({
        ...resolveConfigOrigin,
        rootPath: 123
      })
    ).toThrow()
  })

  it('incorrect static path', () => {
    expect(() =>
      validateСonfig({
        ...resolveConfigOrigin,
        staticPath: 123
      })
    ).toThrow()
  })

  it('incorrect routes path', () => {
    expect(() =>
      validateСonfig({
        ...resolveConfigOrigin,
        routes: 123
      })
    ).toThrow()
  })

  it('incorrect aggregates dir', () => {
    expect(() =>
      validateСonfig({
        ...resolveConfigOrigin,
        aggregates: 123
      })
    ).toThrow()
  })

  it('incorrect view models dir', () => {
    expect(() =>
      validateСonfig({
        ...resolveConfigOrigin,
        viewModels: 123
      })
    ).toThrow()
  })

  it('incorrect read models dir', () => {
    expect(() =>
      validateСonfig({
        ...resolveConfigOrigin,
        readModels: 123
      })
    ).toThrow()
  })

  it('incorrect static dir', () => {
    expect(() =>
      validateСonfig({
        ...resolveConfigOrigin,
        staticDir: 123
      })
    ).toThrow()
  })

  it('incorrect auth', () => {
    expect(() =>
      validateСonfig({
        ...resolveConfigOrigin,
        auth: 123
      })
    ).toThrow()
  })

  it('incorrect jwt', () => {
    expect(() =>
      validateСonfig({
        ...resolveConfigOrigin,
        jwt: {
          cookieName: 123,
          secret: 'some-secret',
          options: {
            maxAge: 1000 * 60 * 60 * 24 * 365
          }
        }
      })
    ).toThrow()
  })
})

describe('resolve-scripts build --сonfig=resolve.test.config.json', () => {
  const resolveConfigPath = path.resolve(__dirname, 'resolve.test.config.json')
  const { env, ...config } = require(resolveConfigPath)

  test(
    'merge cli should work correctly ' +
      '[{} <- defaults <- resolve.config.json <- cli] (mode=development)',
    async () => {
      const json = await exec(
        `resolve-scripts build --config=${resolveConfigPath} --start --dev`
      )

      const resultConfig = {
        ...resolveConfigOrigin,
        ...config,
        ...env.development
      }
      delete resultConfig.env

      expect(json).toMatchObject(resultConfig)
    }
  )

  test(
    'merge cli should work correctly ' +
      '[{} <- defaults <- resolve.config.json <- cli] (mode=production)',
    async () => {
      const json = await exec(
        `resolve-scripts build --config=${resolveConfigPath} --prod`
      )

      const resultConfig = {
        ...resolveConfigOrigin,
        ...config,
        ...env.production
      }
      delete resultConfig.env

      expect(json).toMatchObject(resultConfig)
    }
  )
})
