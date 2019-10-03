import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge,
  stop,
  reset,
  importEventStore,
  exportEventStore,
  declareImportKey
} from 'resolve-scripts'
import resolveModuleComments from 'resolve-module-comments'
import resolveModuleAuth from 'resolve-module-auth'
import resolveModuleReactRouter from 'resolve-module-react-router'

import appConfig from './config.app'
import cloudConfig from './config.cloud'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test-functional'

import runImport from './import'

const launchMode = process.argv[2]

void (async () => {
  try {
    const moduleComments = resolveModuleComments({
      aggregateName: 'Comment',
      readModelName: 'Comments',
      readModelConnectorName: 'comments',
      reducerName: 'comments'
    })

    const moduleAuth = resolveModuleAuth([
      {
        name: 'local-strategy',
        createStrategy: 'auth/create_strategy.js',
        logoutRoute: {
          path: 'logout',
          method: 'POST'
        },
        routes: [
          {
            path: 'register',
            method: 'POST',
            callback: 'auth/route_register_callback.js'
          },
          {
            path: 'login',
            method: 'POST',
            callback: 'auth/route_login_callback.js'
          }
        ]
      }
    ])

    const moduleReactRouter = resolveModuleReactRouter({
      routes: 'client/routes.js',
      redux: {
        reducers: {
          optimistic: 'client/reducers/optimistic.js',
          comments: declareImportKey('comments')
        },
        sagas: [
          'client/sagas/story-create-saga.js',
          'client/sagas/optimistic-voting-saga.js'
        ]
      }
    })

    const baseConfig = merge(
      defaultResolveConfig,
      appConfig,
      moduleReactRouter,
      moduleComments,
      moduleAuth
    )

    switch (launchMode) {
      case 'dev': {
        const resolveConfig = merge(baseConfig, devConfig)
        await reset(resolveConfig, {
          dropEventStore: false,
          dropSnapshots: true,
          dropReadModels: true,
          dropSagas: true
        })
        await watch(resolveConfig)
        break
      }

      case 'build': {
        await build(merge(baseConfig, prodConfig))
        break
      }

      case 'cloud': {
        await build(merge(baseConfig, cloudConfig))
        break
      }

      case 'start': {
        await start(merge(baseConfig, prodConfig))
        break
      }

      case 'reset': {
        const resolveConfig = merge(baseConfig, devConfig)
        await reset(resolveConfig, {
          dropEventStore: true,
          dropSnapshots: true,
          dropReadModels: true,
          dropSagas: true
        })
        break
      }

      case 'import-event-store': {
        const resolveConfig = merge(baseConfig, devConfig)

        const importFile = process.argv[3]

        await importEventStore(resolveConfig, { importFile })
        break
      }

      case 'export-event-store': {
        const resolveConfig = merge(baseConfig, devConfig)

        const exportFile = process.argv[3]

        await exportEventStore(resolveConfig, { exportFile })
        break
      }

      case 'test:functional': {
        const resolveConfig = merge(baseConfig, testFunctionalConfig)

        await reset(resolveConfig, {
          dropEventStore: true,
          dropSnapshots: true,
          dropReadModels: true,
          dropSagas: true
        })

        await runTestcafe({
          resolveConfig,
          functionalTestsDir: 'test/functional',
          browser: process.argv[3]
        })
        break
      }

      case 'import': {
        const config = merge(baseConfig, devConfig)

        await reset(config, {
          dropEventStore: true,
          dropSnapshots: true,
          dropReadModels: true,
          dropSagas: true
        })

        const importConfig = merge(config, {
          eventBroker: { launchBroker: false }
        })
        Object.assign(importConfig, {
          apiHandlers: [
            {
              method: 'POST',
              path: '/api/import_events',
              controller: {
                module: 'import/import_api_handler.js',
                options: {}
              }
            }
          ],
          aggregates: [],
          readModels: [],
          viewModels: [],
          sagas: [],
          readModelConnectors: {},
          schedulers: {}
        })

        if (process.env.hasOwnProperty(String(importConfig.port))) {
          process.env.PORT = +String(process.env.PORT)
        } else if (
          process.env.PORT != null &&
          process.env.PORT.defaultValue != null
        ) {
          process.env.PORT = +process.env.PORT.defaultValue
        } else {
          process.env.PORT = 3000
        }

        Object.assign(process.env, {
          RESOLVE_SERVER_OPEN_BROWSER: 'false',
          ROOT_PATH: importConfig.rootPath
        })

        await build(importConfig)

        await Promise.all([start(importConfig), runImport()])

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
