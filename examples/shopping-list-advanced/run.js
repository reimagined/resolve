import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe
} from 'resolve-scripts'

import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test_functional'
import adjustWebpackConfigs from './config.adjust_webpack'
import appConfig from './config.app'

const launchMode = process.argv[2]

void (async () => {
  switch (launchMode) {
    case 'dev': {
      await watch(
        {
          ...defaultResolveConfig,
          ...appConfig,
          ...devConfig
        },
        adjustWebpackConfigs.bind(null, devConfig)
      )
      break
    }

    case 'build': {
      await build(
        {
          ...defaultResolveConfig,
          ...appConfig,
          ...prodConfig
        },
        adjustWebpackConfigs.bind(null, prodConfig)
      )
      break
    }

    case 'start': {
      await start({
        ...defaultResolveConfig,
        ...appConfig,
        ...prodConfig
      })
      break
    }

    case 'test:functional': {
      await runTestcafe({
        resolveConfig: testFunctionalConfig,
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
})
