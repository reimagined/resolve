/*
  Code in this file bootstraps and run a reSolve application based on 
  different configuration settings under different environments.
*/

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

const launchMode = process.argv[2]

void (async () => {
  try {
    // Here you may want to prepare a base config object
    // that includes all modules that you want to be available for all
    // execution targes:
    // const moduleAuth = resolveModuleAuth([
    //   {
    //     name: 'local-strategy',
    //     createStrategy: 'auth/create_strategy.js',
    //     logoutRoute: {
    //       path: 'logout',
    //       method: 'POST'
    //     },
    //     routes: [
    //       {
    //         path: 'register',
    //         method: 'POST',
    //         callback: 'auth/route_register_callback.js'
    //       },
    //       {
    //         path: 'login',
    //         method: 'POST',
    //         callback: 'auth/route_login_callback.js'
    //       }
    //     ]
    //   }
    // // ])
    // const baseConfig = merge(
    //   defaultResolveConfig,
    //   appConfig,
    //   moduleAuth
    // )

    // Check the execution target and run the corresponding script
    switch (launchMode) {
      case 'dev': {
        // Merge cofiguration objects into the globla config
        // Modify this section to define new execution targets
        // and determine which configs should be available for what targets
        const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)

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
        const resolveConfig = merge(defaultResolveConfig, appConfig, prodConfig)
        await build(resolveConfig)
        break
      }

      case 'cloud': {
        await build(merge(defaultResolveConfig, appConfig, cloudConfig))
        break
      }

      case 'start': {
        await start(merge(defaultResolveConfig, appConfig, prodConfig))
        break
      }

      case 'reset': {
        const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
        await reset(resolveConfig, {
          dropEventStore: false,
          dropSnapshots: true,
          dropReadModels: true,
          dropSagas: true
        })

        break
      }

      case 'import-event-store': {
        const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)

        const importFile = process.argv[3]

        await importEventStore(resolveConfig, { importFile })
        break
      }

      case 'export-event-store': {
        const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)

        const exportFile = process.argv[3]

        await exportEventStore(resolveConfig, { exportFile })
        break
      }

      case 'test:functional': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig
        )

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

      default: {
        throw new Error('Unknown option')
      }
    }
    await stop()
  } catch (error) {
    await stop(error)
  }
})()
