import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge,
  reset
} from 'resolve-scripts'

import resolveModuleAuth from 'resolve-module-auth'

import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import cloudConfig from './config.cloud'
import testFunctionalConfig from './config.test_functional'
import adjustWebpackConfigs from './config.adjust_webpack'

const launchMode = process.argv[2]

void (async (): Promise<void> => {
  const moduleAuth = resolveModuleAuth([
    {
      name: 'local-strategy',
      createStrategy: 'auth/create_strategy.ts',
      logoutRoute: {
        path: 'logout',
        method: 'POST'
      },
      routes: [
        {
          path: 'register',
          method: 'POST',
          callback: 'auth/route_register_callback.ts'
        },
        {
          path: 'login',
          method: 'POST',
          callback: 'auth/route_login_callback.ts'
        }
      ]
    }
  ])

  switch (launchMode) {
    case 'dev': {
      const resolveConfig = merge(
        defaultResolveConfig,
        appConfig,
        devConfig,
        moduleAuth
      )

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
        merge(defaultResolveConfig, appConfig, prodConfig, moduleAuth),
        adjustWebpackConfigs
      )
      break
    }

    case 'start': {
      await start(
        merge(defaultResolveConfig, appConfig, prodConfig, moduleAuth)
      )
      break
    }

    case 'cloud': {
      await build(
        merge(defaultResolveConfig, appConfig, cloudConfig, moduleAuth),
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
