const path = require('path')
const {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge: rawMerge,
  stop,
  reset,
  adjustWebpackReactNative,
  adjustWebpackCommonPackages,
  importEventStore,
  exportEventStore
} = require('resolve-scripts')
const createAuthModule = require('resolve-module-auth').default
const resolveModuleAdmin = require('resolve-module-admin').default
const getLocalIp = require('my-local-ip')
const remotedev = require('remotedev-server')
const opn = require('opn')

const devConfig = require('./config.dev')
const prodConfig = require('./config.prod')
const cloudConfig = require('./config.cloud')
const testFunctionalConfig = require('./config.test-functional')
const appConfig = require('./config.app')

const launchMode = process.argv[2]

const merge = (...configs) => {
  const config = rawMerge(...configs)
  return {
    ...config,
    customConstants: {
      ...config.customConstants,
      backend: {
        protocol: process.env.SHOPPING_LIST_PROTOCOL || 'http',
        hostname: process.env.SHOPPING_LIST_HOSTNAME || getLocalIp(),
        port: process.env.SHOPPING_LIST_PORT || config.port
      },
      remoteReduxDevTools: {
        hostname: process.env.SHOPPING_LIST_HOST || getLocalIp(),
        port: process.env.SHOPPING_LIST_PROTOCOL || 19042
      }
    }
  }
}

const adjustWebpackConfigs = ({
  resolveConfig,
  commonPackages,
  reactNativeDir
}) => (...args) => {
  if (commonPackages) {
    adjustWebpackCommonPackages({
      resolveConfig,
      commonPackages
    })(...args)
  }
  if (reactNativeDir) {
    adjustWebpackReactNative({
      resolveConfig,
      reactNativeDir
    })(...args)
  }
}

const reactNativeDir = path.resolve(__dirname, '../native')
const commonPackages = {
  '@shopping-list-advanced/ui': path.resolve(__dirname, '../ui')
}

void (async () => {
  try {
    const authModule = createAuthModule([
      {
        name: 'local-strategy',
        createStrategy: 'common/auth/create-strategy.js',
        routes: [
          {
            path: 'auth/local/register',
            method: 'POST',
            callback: 'common/auth/route-register-callback.js'
          },
          {
            path: 'auth/local/login',
            method: 'POST',
            callback: 'common/auth/route-login-callback.js'
          }
        ],
        logoutRoute: {
          path: 'auth/local/logout',
          method: 'GET'
        }
      }
    ])

    switch (launchMode) {
      case 'dev': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          devConfig,
          authModule,
          moduleAdmin
        )

        await reset(
          resolveConfig,
          {
            dropEventStore: false,
            dropSnapshots: true,
            dropReadModels: true,
            dropSagas: true
          },
          adjustWebpackConfigs({
            resolveConfig,
            commonPackages
          })
        )

        await watch(
          resolveConfig,
          adjustWebpackConfigs({
            resolveConfig,
            commonPackages
          })
        )
        break
      }
      case 'dev:native': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          devConfig,
          authModule
        )

        await remotedev({
          hostname: resolveConfig.customConstants.remoteReduxDevTools.hostname,
          port: resolveConfig.customConstants.remoteReduxDevTools.port,
          wsEngine: 'ws'
        })

        await opn(
          `http://${resolveConfig.customConstants.remoteReduxDevTools.hostname}:${resolveConfig.customConstants.remoteReduxDevTools.port}`
        )

        await reset(
          resolveConfig,
          {
            dropEventStore: false,
            dropSnapshots: true,
            dropReadModels: true,
            dropSagas: true
          },
          adjustWebpackConfigs({
            resolveConfig,
            commonPackages
          })
        )

        await watch(
          resolveConfig,
          adjustWebpackConfigs({
            resolveConfig,
            reactNativeDir,
            commonPackages
          })
        )
        break
      }

      case 'build': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          prodConfig,
          authModule
        )

        await build(
          resolveConfig,
          adjustWebpackConfigs({
            resolveConfig,
            reactNativeDir,
            commonPackages
          })
        )

        break
      }

      case 'cloud': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          cloudConfig,
          authModule
        )

        await build(
          resolveConfig,
          adjustWebpackConfigs({
            resolveConfig,
            reactNativeDir,
            commonPackages
          })
        )

        break
      }

      case 'start': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          prodConfig,
          authModule
        )

        await start(resolveConfig)

        break
      }

      case 'import-event-store': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig,
          authModule
        )

        const importFile = process.argv[3]

        await importEventStore(
          resolveConfig,
          { importFile },
          adjustWebpackConfigs({
            resolveConfig,
            commonPackages
          })
        )
        break
      }

      case 'export-event-store': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig,
          authModule
        )

        const exportFile = process.argv[3]

        await exportEventStore(
          resolveConfig,
          { exportFile },
          adjustWebpackConfigs({
            resolveConfig,
            commonPackages
          })
        )
        break
      }

      case 'test:functional': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig,
          authModule
        )

        await reset(
          resolveConfig,
          {
            dropEventStore: true,
            dropSnapshots: true,
            dropReadModels: true,
            dropSagas: true
          },
          adjustWebpackConfigs({
            resolveConfig,
            commonPackages
          })
        )

        await runTestcafe({
          resolveConfig,
          adjustWebpackConfigs: adjustWebpackConfigs({
            resolveConfig,
            commonPackages
          }),
          functionalTestsDir: './test/functional',
          browser: process.argv[3]
          // customArgs: ['-r', 'json:report.json']
        })
        break
      }

      default: {
        throw new Error('Unknown option')
      }
    }
    await stop()
  } catch (error) {
    await stop(error)
  }
})()
