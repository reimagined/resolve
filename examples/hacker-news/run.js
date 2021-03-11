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
} from '@resolve-js/scripts'
import resolveModuleComments from '@resolve-js/module-comments'
import resolveModuleAuth from '@resolve-js/module-auth'
import resolveModuleAdmin from '@resolve-js/module-admin'

import appConfig from './config.app'
import cloudConfig from './config.cloud'
import devConfig from './config.dev'
import devReplicaConfig from './config.dev.replica'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test-functional'

import runImport from './import'

const launchMode = process.argv[2]

void (async () => {
  try {
    const moduleComments = resolveModuleComments({
      commentsInstanceName: 'comments-hn',
      aggregateName: 'Comment',
      readModelName: 'Comments',
      readModelConnectorName: 'comments',
      reducerName: 'comments',
    })

    const moduleAuth = resolveModuleAuth([
      {
        name: 'local-strategy',
        createStrategy: 'auth/create_strategy.js',
        logoutRoute: {
          path: 'logout',
          method: 'POST',
        },
        routes: [
          {
            path: 'register',
            method: 'POST',
            callback: 'auth/route_register_callback.js',
          },
          {
            path: 'login',
            method: 'POST',
            callback: 'auth/route_login_callback.js',
          },
        ],
      },
    ])

    const baseConfig = merge(
      defaultResolveConfig,
      appConfig,
      moduleComments,
      moduleAuth
    )

    switch (launchMode) {
      case 'dev': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(baseConfig, devConfig, moduleAdmin)
        await watch(resolveConfig)
        break
      }

      case 'dev:replica': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(baseConfig, devReplicaConfig, moduleAdmin)
        await watch(resolveConfig)
        break
      }

      case 'build': {
        const resolveConfig = merge(baseConfig, prodConfig)
        await build(resolveConfig)
        break
      }

      case 'cloud': {
        const resolveConfig = merge(baseConfig, cloudConfig)
        await build(resolveConfig)
        break
      }

      case 'start': {
        await start(merge(baseConfig, prodConfig))
        break
      }

      case 'reset': {
        const resolveConfig = merge(baseConfig, devConfig)
        await reset(resolveConfig, {
          dropEventStore: false,
          dropEventSubscriber: true,
          dropReadModels: true,
          dropSagas: true,
        })

        break
      }

      case 'import-event-store': {
        const resolveConfig = merge(baseConfig, devConfig)

        const directory = process.argv[3]
        await importEventStore(resolveConfig, { directory })

        break
      }

      case 'export-event-store': {
        const resolveConfig = merge(baseConfig, devConfig)

        const directory = process.argv[3]
        await exportEventStore(resolveConfig, { directory })

        break
      }

      case 'test:e2e': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(
          baseConfig,
          moduleAdmin,
          testFunctionalConfig
        )
        await reset(resolveConfig, {
          dropEventStore: true,
          dropEventSubscriber: true,
          dropReadModels: true,
          dropSagas: true,
        })

        await runTestcafe({
          resolveConfig,
          functionalTestsDir: 'test/functional',
          browser: process.argv[3],
          customArgs: ['--stop-on-first-fail'],
        })

        break
      }

      case 'test:e2e-cloud': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(baseConfig, moduleAdmin, cloudConfig)
        await build(resolveConfig)
        break
      }

      case 'import': {
        const config = merge(baseConfig, devConfig)
        await reset(config, {
          dropEventStore: true,
          dropEventSubscriber: true,
          dropReadModels: true,
          dropSagas: true,
        })

        const importConfig = merge(defaultResolveConfig, devConfig, {
          apiHandlers: [
            {
              method: 'POST',
              path: '/api/import_events',
              handler: {
                module: 'import/import_api_handler.js',
                options: {},
              },
            },
          ],
        })
        importConfig.readModelConnectors = {}

        await build(importConfig)

        await Promise.all([start(importConfig), runImport(importConfig)])

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
