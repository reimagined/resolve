import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge,
  reset,
} from '@resolve-js/scripts'

import resolveModuleAdmin from '@resolve-js/module-admin'

import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import cloudConfig from './config.cloud'
import testFunctionalConfig from './config.test-functional'
import adjustWebpackConfigs from './config.adjust-webpack'
const launchMode = process.argv[2]
void (async () => {
  switch (launchMode) {
    case 'dev': {
      const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
      await watch(resolveConfig, adjustWebpackConfigs)
      break
    }
    case 'reset': {
      const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
      await reset(
        resolveConfig,
        {
          dropEventStore: false,
          dropEventSubscriber: true,
          dropReadModels: true,
          dropSagas: true,
        },
        adjustWebpackConfigs
      )
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
    case 'test:e2e': {
      const moduleAdmin = resolveModuleAdmin()
      const resolveConfig = merge(
        defaultResolveConfig,
        appConfig,
        testFunctionalConfig,
        moduleAdmin
      )
      await reset(
        resolveConfig,
        {
          dropEventStore: true,
          dropEventSubscriber: true,
          dropReadModels: true,
          dropSagas: true,
        },
        adjustWebpackConfigs
      )
      await runTestcafe({
        resolveConfig,
        adjustWebpackConfigs,
        functionalTestsDir: 'test/e2e',
        browser: process.argv[3],
        customArgs: ['--stop-on-first-fail'],
      })
      break
    }
    default: {
      throw new Error('Unknown option')
    }
  }
})().catch((error) => {
  // eslint-disable-next-line no-console
  console.log(error)
  process.exit(1)
})
