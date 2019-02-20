import {
  defaultResolveConfig,
  launchBusBroker,
  build,
  start,
  watch,
  runTestcafe,
  merge
} from 'resolve-scripts'

import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test_functional'

const launchMode = process.argv[2]

void (async () => {
  switch (launchMode) {
    case 'dev': {
      const mergedDevConfig = merge(defaultResolveConfig, appConfig, devConfig)
      await Promise.all([
        watch(mergedDevConfig),
        launchBusBroker(mergedDevConfig)
      ])
      break
    }

    case 'build': {
      await build(merge(defaultResolveConfig, appConfig, prodConfig))
      break
    }

    case 'start': {
      const mergedProdConfig = merge(
        defaultResolveConfig,
        appConfig,
        prodConfig
      )
      await Promise.all([
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
      await Promise.all([
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
})().catch(error => {
  // eslint-disable-next-line no-console
  console.log(error)
  process.exit(1)
})
