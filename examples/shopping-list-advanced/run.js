import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge
} from 'resolve-scripts'
import createAuthModule from 'resolve-module-auth'

import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test_functional'
import adjustWebpackConfigs from './config.adjust_webpack'
import appConfig from './config.app'

const launchMode = process.argv[2]

void (async () => {
  const authModule = createAuthModule([
    {
      name: 'local-strategy',
      createStrategy: 'domain/auth/create_strategy.js',
      routes: [
        {
          path: 'auth/local/register',
          method: 'POST',
          callback: 'domain/auth/route_register_callback.js'
        },
        {
          path: 'auth/local/login',
          method: 'POST',
          callback: 'domain/auth/route_login_callback.js'
        },
        {
          path: 'auth/local/logout',
          method: 'GET',
          callback: 'domain/auth/route_logout_callback.js'
        }
      ]
    }
  ])

  switch (launchMode) {
    case 'dev': {
      await watch(
        merge(defaultResolveConfig, appConfig, devConfig, authModule),
        adjustWebpackConfigs.bind(null, devConfig)
      )
      break
    }

    case 'build': {
      await build(
        merge(defaultResolveConfig, appConfig, prodConfig, authModule),
        adjustWebpackConfigs.bind(null, prodConfig)
      )
      break
    }

    case 'start': {
      await start(
        merge(defaultResolveConfig, appConfig, prodConfig, authModule)
      )
      break
    }

    case 'test:functional': {
      await runTestcafe({
        resolveConfig: merge(
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig,
          authModule
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
})().catch(error => {
  // eslint-disable-next-line no-console
  console.log(error)
})
