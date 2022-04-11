import getWebpackConfigs from '../src/get_webpack_configs'
import normalizePaths from './normalize_paths'

jest.mock(
  '@purtuga/esm-webpack-plugin',
  () =>
    function () {
      this.MODULE = 'esm-webpack-plugin'
    }
)
jest.mock('webpack-node-externals', () => (...args) => args)

const resolveConfig = {
  port: 3000,
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  aggregates: [],
  readModels: [],
  viewModels: [],
  sagas: [],
  apiHandlers: [],
  index: 'client/index.js',
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/event-store.db',
    },
  },
  snapshotAdapter: {
    module: '@resolve-js/snapshot-lite',
    options: {},
  },
  schedulers: {},
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
  customConstants: {},
  clientImports: {},
  serverImports: {},
  clientEntries: [],
  target: 'local',
}

test('should make webpack configs for local mode', async () => {
  const nodeModulesByAssembly = new Map()

  const webpackConfigs = await getWebpackConfigs({
    resolveConfig: {
      ...resolveConfig,
      runtime: {
        module: '@resolve-js/runtime-single-process',
      },
    },
    nodeModulesByAssembly,
  })

  expect(
    normalizePaths(JSON.stringify(webpackConfigs, null, 2))
  ).toMatchSnapshot()

  expect(
    normalizePaths(JSON.stringify(Array.from(nodeModulesByAssembly), null, 2))
  ).toMatchSnapshot()
})

test('should make webpack configs for cloud mode', async () => {
  const nodeModulesByAssembly = new Map()

  const webpackConfigs = await getWebpackConfigs({
    resolveConfig: {
      ...resolveConfig,
      runtime: {
        module: '@resolve-js/runtime-aws-serverless',
      },
    },
    nodeModulesByAssembly,
  })

  expect(
    normalizePaths(JSON.stringify(webpackConfigs, null, 2))
  ).toMatchSnapshot()

  expect(
    normalizePaths(JSON.stringify(Array.from(nodeModulesByAssembly), null, 2))
  ).toMatchSnapshot()
})

test('should make external package.json resolver', async () => {
  const nodeModulesByAssembly = new Map()

  const webpackConfigs = await getWebpackConfigs({
    resolveConfig: {
      ...resolveConfig,
      runtime: {
        module: '@resolve-js/runtime-single-process',
      },
    },
    nodeModulesByAssembly,
  })

  const externalResolver = webpackConfigs[1].externals[0]
  externalResolver(null, './resource', () => {})
  externalResolver(null, '/resource', () => {})
  externalResolver(null, '@org/package', () => {})
  externalResolver(null, 'package', () => {})

  expect(
    normalizePaths(JSON.stringify(Array.from(nodeModulesByAssembly), null, 2))
  ).toMatchSnapshot()
})
