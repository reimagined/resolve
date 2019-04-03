import {
  defaultResolveConfig,
  launchBusBroker,
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
        const mergedDevConfig = merge(
          defaultResolveConfig,
          appConfig,
          devConfig
        )
        await Promise.race([
          watch(mergedDevConfig),
          launchBusBroker(mergedDevConfig)
        ])
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
        const mergedProdConfig = merge(
          defaultResolveConfig,
          appConfig,
          prodConfig
        )
        await Promise.race([
          start(mergedProdConfig),
          launchBusBroker(mergedProdConfig)
        ])
        break
      }

      case 'test:functional': {
        const mergedTestFunctionalConfig = merge(
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig
        )
        if (fs.existsSync('read-models-test-functional.db')) {
          fs.unlinkSync('read-models-test-functional.db')
        }
        if (fs.existsSync('event-store-test-functional.db')) {
          fs.unlinkSync('event-store-test-functional.db')
        }
        if (fs.existsSync('local-bus-broker.db')) {
          fs.unlinkSync('local-bus-broker.db')
        }
        await Promise.race([
          runTestcafe({
            resolveConfig: mergedTestFunctionalConfig,
            functionalTestsDir: 'test/functional',
            browser: process.argv[3]
          }),
          launchBusBroker(mergedTestFunctionalConfig)
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

process.on('SIGINT', stop)
