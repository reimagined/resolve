import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge,
  stop,
  reset,
} from '@resolve-js/scripts'

import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test_functional'
import resolveModuleAdmin from '@resolve-js/module-admin'

const launchMode = process.argv[2]

void (async () => {
  try {
    switch (launchMode) {
      case 'dev': {
        const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
        await watch(resolveConfig)
        break
      }

      case 'reset': {
        const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
        await reset(resolveConfig, {
          dropEventStore: false,
          dropEventBus: true,
          dropReadModels: true,
          dropSagas: true,
        })
        break
      }

      case 'build': {
        await build(merge(defaultResolveConfig, appConfig, prodConfig))
        break
      }

      case 'start': {
        await start(merge(defaultResolveConfig, appConfig, prodConfig))
        break
      }

      case 'test:e2e': {
        const moduleAdmin = resolveModuleAdmin()
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig,
          moduleAdmin
        )

        await reset(resolveConfig, {
          dropEventStore: true,
          dropEventBus: true,
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

      default: {
        throw new Error('Unknown option')
      }
    }
    await stop()
  } catch (error) {
    await stop(error)
  }
})()
