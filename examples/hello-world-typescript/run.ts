import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge,
  reset
} from 'resolve-scripts'

import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import cloudConfig from './config.cloud'
import testFunctionalConfig from './config.test_functional'
import adjustWebpackConfigs from './config.adjust_webpack'

const launchMode = process.argv[2]

void (async () => {
  switch (launchMode) {
    case 'dev': {
      const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)

      await reset(
        resolveConfig,
        {
          dropEventStore: false,
          dropSnapshots: true,
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

    case 'cloud': {
      await build(
        merge(defaultResolveConfig, appConfig, cloudConfig),
        adjustWebpackConfigs
      )
      break
    }

    case 'test:functional': {
      const resolveConfig = merge(
        defaultResolveConfig,
        appConfig,
        testFunctionalConfig
      )

      await reset(
        resolveConfig,
        {
          dropEventStore: true,
          dropSnapshots: true,
          dropReadModels: true,
          dropSagas: true
        },
        adjustWebpackConfigs
      )

      await runTestcafe({
        resolveConfig,
        adjustWebpackConfigs,
        functionalTestsDir: 'test/functional',
        browser: process.argv[3]
      })
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
