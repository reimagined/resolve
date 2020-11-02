import {
  defaultResolveConfig,
  build,
  start,
  watch,
  merge,
  stop,
  reset,
  runTestcafe,
} from 'resolve-scripts'

import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test_functional'
import adjustWebpackConfigs from './config.adjust_webpack'

const launchMode = process.argv[2]

void (async () => {
  try {
    switch (launchMode) {
      case 'dev': {
        const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
        await watch(resolveConfig, adjustWebpackConfigs)
        break
      }

      case 'reset': {
        const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
        await reset(
          resolveConfig,
          {
            dropEventStore: false,
            dropEventBus: true,
            dropReadModels: true,
            dropSagas: true,
          },
          adjustWebpackConfigs
        )
        break
      }

      case 'build': {
        await build(
          merge(defaultResolveConfig, appConfig, prodConfig),
          adjustWebpackConfigs
        )
        break
      }

      case 'start': {
        await start(merge(defaultResolveConfig, appConfig, prodConfig))
        break
      }

      case 'test:e2e': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig
        )

        await reset(
          resolveConfig,
          {
            dropEventStore: true,
            dropEventBus: true,
            dropReadModels: true,
            dropSagas: true,
          },
          adjustWebpackConfigs
        )

        await runTestcafe({
          resolveConfig,
          adjustWebpackConfigs,
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
