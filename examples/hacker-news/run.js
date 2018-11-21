import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge
} from 'resolve-scripts'
import resolveModuleComments from 'resolve-module-comments'
import resolveModuleAuth from 'resolve-module-auth'

import appConfig from './config.app'
import cloudConfig from './config.cloud'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test-functional'

const launchMode = process.argv[2]

void (async () => {
  const moduleComments = resolveModuleComments()

  const moduleAuth = resolveModuleAuth([
    {
      name: 'local-strategy',
      createStrategy: 'auth/create_strategy.js',
      routes: [
        {
          path: 'register',
          method: 'POST',
          callback: 'auth/route_register_callback.js'
        },
        {
          path: 'login',
          method: 'POST',
          callback: 'auth/route_login_callback.js'
        },
        {
          path: 'logout',
          method: 'POST',
          callback: 'auth/route_logout_callback.js'
        }
      ]
    }
  ])

  switch (launchMode) {
    case 'dev': {
      await watch(
        merge(
          defaultResolveConfig,
          appConfig,
          devConfig,
          moduleComments,
          moduleAuth
        )
      )
      break
    }

    case 'build': {
      await build(
        merge(
          defaultResolveConfig,
          appConfig,
          prodConfig,
          moduleComments,
          moduleAuth
        )
      )
      break
    }

    case 'cloud': {
      await build(
        merge(
          defaultResolveConfig,
          appConfig,
          cloudConfig,
          moduleComments,
          moduleAuth
        )
      )
      break
    }

    case 'start': {
      await start(
        merge(
          defaultResolveConfig,
          appConfig,
          prodConfig,
          moduleComments,
          moduleAuth
        )
      )
      break
    }

    case 'test:functional': {
      await runTestcafe({
        resolveConfig: merge(
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig,
          moduleComments,
          moduleAuth
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
  process.exit(1)
})
