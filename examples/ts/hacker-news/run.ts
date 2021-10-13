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
import resolveModuleReplication from '@resolve-js/module-replication'

import appConfig from './config.app'
import cloudConfig from './config.cloud'
import cloudReplicaConfig from './config.cloud.replica'
import devConfig from './config.dev'
import devReplicaConfig from './config.dev.replica'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test-functional'
import adjustWebpackConfigs from './config.adjust-webpack'

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
        createStrategy: 'auth/create-strategy.ts',
        logoutRoute: {
          path: 'logout',
          method: 'POST',
        },
        routes: [
          {
            path: 'register',
            method: 'POST',
            callback: 'auth/route-register-callback.ts',
          },
          {
            path: 'login',
            method: 'POST',
            callback: 'auth/route-login-callback.ts',
          },
        ],
      },
    ])

    const moduleReplication = resolveModuleReplication()

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
        await watch(resolveConfig, adjustWebpackConfigs)
        break
      }

      case 'dev:replica': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(
          baseConfig,
          devReplicaConfig,
          moduleReplication,
          moduleAdmin
        )
        await watch(resolveConfig, adjustWebpackConfigs)
        break
      }

      case 'build': {
        const resolveConfig = merge(baseConfig, prodConfig)
        await build(resolveConfig, adjustWebpackConfigs)
        break
      }

      case 'cloud': {
        const resolveConfig = merge(baseConfig, cloudConfig)
        await build(resolveConfig, adjustWebpackConfigs)
        break
      }

      case 'cloud:replica': {
        const resolveConfig = merge(
          baseConfig,
          cloudReplicaConfig,
          moduleReplication
        )
        await build(resolveConfig, adjustWebpackConfigs)
        break
      }

      case 'start': {
        await start(merge(baseConfig, prodConfig))
        break
      }

      case 'reset': {
        const resolveConfig = merge(baseConfig, devConfig)
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

        break
      }

      case 'import-event-store': {
        const resolveConfig = merge(baseConfig, devConfig)

        const directory = process.argv[3]
        await importEventStore(
          resolveConfig,
          { directory },
          adjustWebpackConfigs
        )

        break
      }

      case 'export-event-store': {
        const resolveConfig = merge(baseConfig, devConfig)

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
          baseConfig,
          moduleAdmin,
          testFunctionalConfig
        )

        /*
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
         */

        await runTestcafe({
          resolveConfig,
          adjustWebpackConfigs,
          functionalTestsDir: 'test/e2e',
          browser: process.argv[3],
          customArgs: ['--stop-on-first-fail'],
          resetDomainOptions: {
            dropEventStore: true,
            dropEventSubscriber: true,
            dropReadModels: true,
            dropSagas: true,
            bootstrap: true,
          },
        })

        break
      }

      case 'test:e2e-cloud': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(baseConfig, moduleAdmin, cloudConfig)
        await build(resolveConfig, adjustWebpackConfigs)
        break
      }

      case 'import': {
        const config = merge(baseConfig, devConfig)
        await reset(
          config,
          {
            dropEventStore: true,
            dropEventSubscriber: true,
            dropReadModels: true,
            dropSagas: true,
          },
          adjustWebpackConfigs
        )

        const importConfig = merge(defaultResolveConfig, devConfig, {
          apiHandlers: [
            {
              method: 'POST',
              path: '/api/import-events',
              handler: {
                module: 'import/import-api-handler.ts',
                options: {},
              },
            },
            {
              method: 'POST',
              path: '/api/import-secrets',
              handler: {
                module: 'import/import-secret-api-handler.ts',
                options: {},
              },
            },
          ],
        })
        importConfig.readModelConnectors = {}

        await build(importConfig, adjustWebpackConfigs)

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
