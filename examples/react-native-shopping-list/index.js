import { build, start, watch, runTestcafe } from 'resolve-scripts'

import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test_functional'
import adjustWebpackConfigs from './config.adjust_webpack'

const launchMode = process.argv[2]

void (async () => {
  switch (launchMode) {
    case 'dev': {
      await watch(devConfig, adjustWebpackConfigs.bind(null, devConfig))
      break
    }

    case 'build': {
      await build(prodConfig, adjustWebpackConfigs.bind(null, prodConfig))
      break
    }

    case 'start': {
      await start(prodConfig)
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
