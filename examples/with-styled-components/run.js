import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge,
  stop,
  reset
} from 'resolve-scripts'

import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test_functional'

const launchMode = process.argv[2]

void (async () => {
  try {
    switch (launchMode) {
      case 'dev': {
        const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
        await Promise.all([
          reset(resolveConfig, {
            dropEventStore: false,
            dropSnapshots: true,
            dropReadModels: true,
            dropSagas: true
          }),
          watch(resolveConfig)
        ])
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

      case 'test:functional': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig
        )

        await Promise.all([
          reset(resolveConfig, {
            dropEventStore: true,
            dropSnapshots: true,
            dropReadModels: true,
            dropSagas: true
          }),
          runTestcafe({
            resolveConfig,
            functionalTestsDir: 'test/functional',
            browser: process.argv[3]
          })
        ])
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
