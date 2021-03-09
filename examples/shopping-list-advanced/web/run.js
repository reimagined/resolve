const {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge: rawMerge,
  stop,
  reset,
  importEventStore,
  exportEventStore,
} = require('@resolve-js/scripts')
const createAuthModule = require('@resolve-js/module-auth').default
const resolveModuleAdmin = require('@resolve-js/module-admin').default
const getLocalIp = require('my-local-ip')
const remotedev = require('remotedev-server')
const opn = require('opn')

const adjustWebpackConfigs = require('./config.adjust-webpack')
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
        port: process.env.SHOPPING_LIST_PORT || config.port,
      },
      remoteReduxDevTools: {
        hostname: process.env.SHOPPING_LIST_HOST || getLocalIp(),
        port: process.env.SHOPPING_LIST_PROTOCOL || 19042,
      },
    },
  }
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
            callback: 'common/auth/route-register-callback.js',
          },
          {
            path: 'auth/local/login',
            method: 'POST',
            callback: 'common/auth/route-login-callback.js',
          },
        ],
        logoutRoute: {
          path: 'auth/local/logout',
          method: 'GET',
        },
      },
    ])

    switch (launchMode) {
      case 'reset': {
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
            dropEventSubscriber: true,
            dropReadModels: true,
            dropSagas: true,
          },
          adjustWebpackConfigs
        )
        break
      }
      case 'dev': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          devConfig,
          authModule,
          moduleAdmin
        )

        await watch(resolveConfig, adjustWebpackConfigs)
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
          wsEngine: 'ws',
        })

        await opn(
          `http://${resolveConfig.customConstants.remoteReduxDevTools.hostname}:${resolveConfig.customConstants.remoteReduxDevTools.port}`
        )

        await watch(resolveConfig, adjustWebpackConfigs)
        break
      }

      case 'build': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          prodConfig,
          authModule
        )

        await build(resolveConfig, adjustWebpackConfigs)

        break
      }

      case 'cloud': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          cloudConfig,
          authModule
        )

        await build(resolveConfig, adjustWebpackConfigs)

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

        const directory = process.argv[3]

        await importEventStore(
          resolveConfig,
          { directory },
          adjustWebpackConfigs
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

        const directory = process.argv[3]

        await exportEventStore(
          resolveConfig,
          { directory },
          adjustWebpackConfigs
        )
        break
      }

      case 'test:e2e': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig,
          moduleAdmin,
          authModule
        )

        await reset(
          resolveConfig,
          {
            dropEventStore: true,
            dropEventSubscriber: true,
            dropReadModels: true,
            dropSagas: true,
          },
          adjustWebpackConfigs
        )

        await runTestcafe({
          resolveConfig,
          adjustWebpackConfigs,
          functionalTestsDir: './test/functional',
          browser: process.argv[3],
          customArgs: ['--stop-on-first-fail'],
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
