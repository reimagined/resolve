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
  exportEventStore
} from 'resolve-scripts'

import appConfig from './config.app'
import cloudConfig from './config.cloud'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test_functional'
import resolveModuleUploader from 'resolve-module-uploader'
import jwtSecret from './common/jwt_secret'
import resolveModuleAuth from 'resolve-module-auth'

const launchMode = process.argv[2]

void (async () => {
  try {
    const moduleUploader = resolveModuleUploader({ jwtSecret })
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
      moduleAuth,
      moduleUploader
    )

    switch (launchMode) {
      case 'dev': {
        const resolveConfig = merge(baseConfig, devConfig)

        await reset(resolveConfig, {
          dropEventStore: false,
          dropEventBus: true,

          dropReadModels: true,
          dropSagas: true
        })

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
          dropEventBus: true,

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

      default: {
        throw new Error('Unknown option')
      }
    }
    await stop()
  } catch (error) {
    await stop(error)
  }
})()
