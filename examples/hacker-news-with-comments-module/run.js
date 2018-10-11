import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe
} from 'resolve-scripts'
import merge from 'deepmerge'
import resolveModuleComments from 'resolve-module-comments'

import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test_functional'

const launchMode = process.argv[2]

void (async () => {
  const moduleComments = resolveModuleComments()

  switch (launchMode) {
    case 'dev': {
      await watch(
        merge.all([defaultResolveConfig, appConfig, devConfig, moduleComments])
      )
      break
    }

    case 'build': {
      await build(
        merge.all([defaultResolveConfig, appConfig, prodConfig, moduleComments])
      )
      break
    }

    case 'start': {
      await start(
        merge.all([defaultResolveConfig, appConfig, prodConfig, moduleComments])
      )
      break
    }

    case 'test:functional': {
      await runTestcafe({
        resolveConfig: merge.all([
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig,
          moduleComments
        ]),
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
