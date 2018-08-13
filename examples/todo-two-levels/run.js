import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe
} from 'resolve-scripts'

import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test_functional'

const launchMode = process.argv[2]

void (async () => {
  switch (launchMode) {
    case 'dev': {
      await watch({
        ...defaultResolveConfig,
        ...appConfig,
        ...devConfig
      })
      break
    }

    case 'build': {
      await build({
        ...defaultResolveConfig,
        ...appConfig,
        ...prodConfig
      })
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
        resolveConfig: {
          ...defaultResolveConfig,
          ...appConfig,
          ...testFunctionalConfig
        },
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
