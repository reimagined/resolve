import {
  defaultResolveConfig,
  build,
  watch,
  merge,
  stop,
  reset,
} from '@resolve-js/scripts'
import resolveModuleAdmin from '@resolve-js/module-admin'
import resolveModuleUploader from '@resolve-js/module-uploader'

import appConfig from './config.app'
import cloudConfig from './config.cloud'
import devConfig from './config.dev'

const launchMode = process.argv[2]

void (async () => {
  try {
    const moduleUploader = resolveModuleUploader({
      publicDirs: ['images'],
      expireTime: 604800,
      jwtSecret: 'SECRETJWT',
    })

    const baseConfig = merge(defaultResolveConfig, appConfig, moduleUploader)

    switch (launchMode) {
      case 'dev': {
        const resolveConfig = merge(baseConfig, devConfig)

        await reset(resolveConfig, {
          dropEventStore: true,
          dropEventSubscriber: true,
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
    console.log(error)
    await stop(error)
  }
})()
