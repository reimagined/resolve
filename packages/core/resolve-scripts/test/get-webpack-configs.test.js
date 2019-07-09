import getWebpackConfigs from '../src/get_webpack_configs'
import normalizePaths from './normalize_paths'

const resolveConfig = {
  port: 3000,
  polyfills: [],
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  routes: 'client/routes.js',
  aggregates: [],
  readModels: [],
  viewModels: [],
  sagas: [],
  apiHandlers: [],
  index: 'client/index.js',
  redux: {
    reducers: {},
    middlewares: [],
    sagas: [],
    enhancers: []
  },
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {
      databaseFile: 'data/event-store.db'
    }
  },
  subscribeAdapter: {
    module: 'resolve-subscribe-socket.io',
    options: {}
  },
  snapshotAdapter: {
    module: 'resolve-snapshot-lite',
    options: {}
  },
  readModelConnectors: {},
  schedulers: {},
  eventBroker: {
    launchBroker: true,
    zmqBrokerAddress: 'tcp://127.0.0.1:3500',
    zmqConsumerAddress: 'tcp://127.0.0.1:3501',
    databaseFile: 'data/local-bus-broker.db',
    batchSize: 100,
    upstream: true
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  },
  customConstants: {}
}

test('should throw on wrong target', async () => {
  try {
    await getWebpackConfigs({
      resolveConfig: {
        ...resolveConfig,
        target: 'wrong'
      },
      nodeModulesByAssembly: new Map()
    })

    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
  }
})

test('should make webpack configs for local mode', async () => {
  const nodeModulesByAssembly = new Map()

  const webpackConfigs = await getWebpackConfigs({
    resolveConfig: {
      ...resolveConfig,
      target: 'local'
    },
    nodeModulesByAssembly
  })

  expect(normalizePaths(JSON.stringify(webpackConfigs))).toMatchSnapshot()

  expect(
    normalizePaths(JSON.stringify(Array.from(nodeModulesByAssembly)))
  ).toMatchSnapshot()
})

test('should make webpack configs for cloud mode', async () => {
  const nodeModulesByAssembly = new Map()

  const webpackConfigs = await getWebpackConfigs({
    resolveConfig: {
      ...resolveConfig,
      target: 'cloud'
    },
    nodeModulesByAssembly
  })

  expect(normalizePaths(JSON.stringify(webpackConfigs))).toMatchSnapshot()

  expect(
    normalizePaths(JSON.stringify(Array.from(nodeModulesByAssembly)))
  ).toMatchSnapshot()
})

test('should make external package.json resolver', async () => {
  const nodeModulesByAssembly = new Map()

  const webpackConfigs = await getWebpackConfigs({
    resolveConfig: {
      ...resolveConfig,
      target: 'local'
    },
    nodeModulesByAssembly
  })

  const externalResolver = webpackConfigs[1].externals[0]
  externalResolver(null, './resource', () => {})
  externalResolver(null, '/resource', () => {})
  externalResolver(null, '@org/package', () => {})
  externalResolver(null, 'package', () => {})

  expect(
    normalizePaths(JSON.stringify(Array.from(nodeModulesByAssembly)))
  ).toMatchSnapshot()
})
