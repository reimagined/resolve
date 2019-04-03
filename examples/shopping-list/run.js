import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge,
  stop
} from 'resolve-scripts'
import fs from 'fs'

import appConfig from './config.app'
import cloudConfig from './config.cloud'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test_functional'

const launchMode = process.argv[2]

void (async () => {
  try {
    switch (launchMode) {
      case 'dev': {
        await watch(merge(
          defaultResolveConfig,
          appConfig,
          devConfig
        ))
        break
      }

      case 'build': {
        await build(merge(defaultResolveConfig, appConfig, prodConfig))
        break
      }

      case 'cloud': {
        await build(merge(defaultResolveConfig, appConfig, cloudConfig))
        break
      }

      case 'start': {
        await start(merge(
          defaultResolveConfig,
          appConfig,
          prodConfig
        ))
        break
      }

      case 'test:functional': {
        [
          'read-models-test-functional.db',
          'event-store-test-functional.db',
          'local-bus-broker-test-functional.db'
        ].forEach(file => fs.existsSync(file) && fs.unlinkSync(file))

        await runTestcafe({
          resolveConfig: merge(
            defaultResolveConfig,
            appConfig,
            testFunctionalConfig
          ),
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

process.on('SIGINT', stop)
