import {
  defaultResolveConfig,
  build,
  watch,
  runTestcafe,
  merge,
  stop,
  reset,
} from '@resolve-js/scripts'

import appConfig from './config.app'
import cloudConfig from './config.cloud'
import devConfig from './config.dev'
import testFunctionalConfig from './config.test-functional'
import adjustWebpackConfigs from './config.adjust-webpack'

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
            dropEventSubscriber: true,
            dropReadModels: true,
            dropSagas: true,
          },
          adjustWebpackConfigs
        )
        break
      }

      case 'cloud': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          cloudConfig
        )

        await build(resolveConfig, adjustWebpackConfigs)
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
            dropEventSubscriber: true,
            dropReadModels: true,
            dropSagas: true,
          },
          adjustWebpackConfigs
        )

        await runTestcafe({
          resolveConfig,
          adjustWebpackConfigs,
          functionalTestsDir: 'test/e2e',
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
