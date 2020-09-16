import {
  defaultResolveConfig,
  build,
  watch,
  merge,
  stop,
  reset,
} from 'resolve-scripts'
import resolveModuleAdmin from 'resolve-module-admin'

import appConfig from './config.app'
import cloudConfig from './config.cloud'
import devConfig from './config.dev'

const launchMode = process.argv[2]

void (async () => {
  try {
    const baseConfig = merge(defaultResolveConfig, appConfig)

    switch (launchMode) {
      case 'dev': {
        const resolveConfig = merge(baseConfig, devConfig)

        await reset(resolveConfig, {
          dropEventStore: false,
          dropEventBus: true,
          dropReadModels: true,
          dropSagas: true,
        })

        await watch(resolveConfig)
        break
      }

      case 'cloud': {
        const moduleAdmin = resolveModuleAdmin()
        await build(merge(baseConfig, moduleAdmin, cloudConfig))
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
