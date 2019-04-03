import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge,
  stop
} from 'resolve-scripts'
import fs from 'fs'
import resolveModuleComments from 'resolve-module-comments'
import resolveModuleAuth from 'resolve-module-auth'

import appConfig from './config.app'
import cloudConfig from './config.cloud'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test-functional'

import runImport from './import'

const launchMode = process.argv[2]

void (async () => {
  try {
    const moduleComments = resolveModuleComments()

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

    const baseConfig = merge(
      defaultResolveConfig,
      appConfig,
      moduleComments,
      moduleAuth
    )

    switch (launchMode) {
      case 'dev': {
        await watch(merge(baseConfig, devConfig))
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

      case 'test:functional': {
        [
          'read-models-test-functional.db',
          'event-store-test-functional.db',
          'local-bus-broker-test-functional.db'
        ].forEach(file => fs.existsSync(file) && fs.unlinkSync(file))

        await runTestcafe({
          resolveConfig: merge(baseConfig, testFunctionalConfig),
          functionalTestsDir: 'test/functional',
          browser: process.argv[3]
        })
        break
      }

      case 'import': {
        const config = merge(baseConfig, devConfig)
        const importConfig = merge(config, {
          apiHandlers: [
            {
              method: 'POST',
              path: 'import_events',
              controller: {
                module: 'import/import_api_handler.js',
                options: {
                  storageAdapterOptions: config.storageAdapter.options
                },
                imports: {
                  storageAdapterModule: config.storageAdapter.module
                }
              }
            }
          ]
        })

        Object.assign(process.env, {
          RESOLVE_SERVER_OPEN_BROWSER: 'false',
          PORT: config.port,
          ROOT_PATH: config.rootPath
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

process.on('SIGINT', stop)
