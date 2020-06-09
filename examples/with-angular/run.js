import {
  defaultResolveConfig,
  build,
  start,
  watch,
  merge,
  stop,
  reset
} from 'resolve-scripts'

import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import adjustWebpackConfigs from './config.adjust_webpack'

const launchMode = process.argv[2]

void (async () => {
  try {
    switch (launchMode) {
      case 'dev': {
        const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)

        await reset(
          resolveConfig,
          {
            dropEventStore: false,
            dropEventBus: true,
            dropReadModels: true,
            dropSagas: true
          },
          adjustWebpackConfigs
        )

        await watch(resolveConfig, adjustWebpackConfigs)
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

      default: {
        throw new Error('Unknown option')
      }
    }
    await stop()
  } catch (error) {
    await stop(error)
  }
})()
