import {
  defaultResolveConfig,
  build,
  watch,
  merge,
  stop,
  reset
} from 'resolve-scripts'

import appConfig from './config.app'
import cloudConfig from './config.cloud'
import devConfig from './config.dev'

const launchMode = process.argv[2]

void (async () => {
  try {
    switch (launchMode) {
      case 'dev': {
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

      case 'cloud': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          cloudConfig
        )

        await build(resolveConfig)
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
