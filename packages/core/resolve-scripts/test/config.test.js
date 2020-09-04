import defaultResolveConfig from '../configs/default.resolve.config.json'
import validateConfig from '../src/validate_config'

const resolveConfigOrigin = {
  ...defaultResolveConfig,
  eventstoreAdapter: {
    module: 'resolve-eventstore-lite',
    options: {},
  },
}

jest.setTimeout(30000)

describe('validate schema', () => {
  it('empty', () => {
    expect(
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
      })
    ).toBeTruthy()
  })

  it('custom eventstore adapter', () => {
    expect(
      validateConfig({
        ...resolveConfigOrigin,
        mode: 'development',
        target: 'local',
        eventstoreAdapter: {
          module: 'resolve-eventstore-mysql',
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
          module: 'resolve-bus-rabbitmq',
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
