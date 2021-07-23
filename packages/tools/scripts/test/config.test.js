import defaultResolveConfig from '../configs/default.resolve.config.json'
import validateConfig from '../src/validate_config'

const resolveConfigOrigin = {
  ...defaultResolveConfig,
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {},
  },
}

jest.setTimeout(30000)

describe('validate schema', () => {
  let consoleWarn
  beforeAll(() => {
    consoleWarn = jest.spyOn(console, 'warn')
  })
  afterAll(() => {
    jest.restoreAllMocks()
  })
  it('empty', () => {
    expect(
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
      })
    ).toBeTruthy()
  })

  it('no unexpected warnings', async () => {
    await validateConfig({
      ...resolveConfigOrigin,
      mode: 'development',
      target: 'local',
    })
    expect(consoleWarn).not.toHaveBeenCalled()
  })

  it('custom eventstore adapter', () => {
    expect(
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        eventstoreAdapter: {
          module: '@resolve-js/eventstore-mysql',
          options: {
            eventsTableName: 'MyEvents',
          },
        },
      })
    ).toBeTruthy()
  })

  it('custom bus adapter', () => {
    expect(
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        eventstoreAdapter: {
          module: '@resolve-js/bus-rabbitmq',
          options: {},
        },
      })
    ).toBeTruthy()
  })

  it('custom root path', () => {
    expect(
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        rootPath: 'my-app',
      })
    ).toBeTruthy()
  })

  it('custom static path', () => {
    expect(
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        staticPath: 'my-cdn',
      })
    ).toBeTruthy()
  })

  it('custom aggregates dir', () => {
    expect(
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        aggregates: [],
      })
    ).toBeTruthy()
  })

  it('custom view models dir', () => {
    expect(
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        viewModels: [],
      })
    ).toBeTruthy()
  })

  it('custom read models dir', () => {
    expect(
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        readModels: [],
      })
    ).toBeTruthy()
  })

  it('custom static dir', () => {
    expect(
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        staticDir: 'my-static-dir',
      })
    ).toBeTruthy()
  })

  it('custom jwt', () => {
    expect(
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        jwtCookie: {
          name: 'authToken',
          maxAge: 1000 * 60 * 60 * 24 * 365,
        },
      })
    ).toBeTruthy()
  })

  it('middlewares', () => {
    const resolveConfig = {
      ...defaultResolveConfig,
      eventstoreAdapter: {
        module: '@resolve-js/eventstore-lite',
        options: {},
      },
      target: 'local',
      mode: 'development',
      middlewares: {
        aggregate: [
          './dummy-aggregate-middleware.js',
          './dummy-aggregate-middleware-2.js',
        ],
        readModel: {
          resolver: [
            './dummy-resolver-middleware.js',
            './dummy-resolver-middleware-2.js',
          ],
          projection: [
            './dummy-projection-middleware.js',
            './dummy-projection-middleware-2.js',
          ],
        },
      },
    }

    expect(() => validateConfig(resolveConfig)).not.toThrow()
  })

  it('commandHttpResponseMode', () => {
    const resolveConfig = {
      ...resolveConfigOrigin,
      target: 'local',
      mode: 'development',
      aggregates: [
        {
          name: 'MyAggregate',
          commands: 'my-aggregate.commands.js',
          projection: 'my-aggregate.projection.js',
          commandHttpResponseMode: 'empty',
        },
        {
          name: 'MyAggregate2',
          commands: 'my-aggregate2.commands.js',
          projection: 'my-aggregate2.projection.js',
          commandHttpResponseMode: 'event',
        },
      ],
    }

    expect(() => validateConfig(resolveConfig)).not.toThrow()
  })
})

describe('validate schema (fail)', () => {
  it('incorrect eventstore adapter', () => {
    expect(() =>
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        eventstoreAdapter: {
          module: 123,
          options: {
            collectionName: 'MyEvents',
          },
        },
      })
    ).toThrow()
  })

  it('incorrect bus adapter', () => {
    expect(() =>
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        eventstoreAdapter: {
          module: 123,
          options: {},
        },
      })
    ).toThrow()
  })

  it('incorrect subscribe adapter', () => {
    expect(() =>
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        subscribeAdapter: {
          module: 123,
          options: {},
        },
      })
    ).toThrow()
  })

  it('incorrect root path', () => {
    expect(() =>
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        rootPath: 123,
      })
    ).toThrow()
  })

  it('incorrect static path', () => {
    expect(() =>
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        staticPath: 123,
      })
    ).toThrow()
  })

  it('incorrect aggregates dir', () => {
    expect(() =>
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        aggregates: 123,
      })
    ).toThrow()
  })

  it('incorrect view models dir', () => {
    expect(() =>
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        viewModels: 123,
      })
    ).toThrow()
  })

  it('incorrect read models dir', () => {
    expect(() =>
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        readModels: 123,
      })
    ).toThrow()
  })

  it('incorrect static dir', () => {
    expect(() =>
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        staticDir: 123,
      })
    ).toThrow()
  })

  it('incorrect auth', () => {
    expect(() =>
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        auth: 123,
      })
    ).toThrow()
  })

  it('incorrect jwtCookie', () => {
    expect(() =>
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        jwtCookie: {
          name: 123,
          secret: 'some-secret',
          options: {
            maxAge: 1000 * 60 * 60 * 24 * 365,
          },
        },
      })
    ).toThrow()
  })
})
