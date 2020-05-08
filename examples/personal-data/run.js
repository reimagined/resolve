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
import resolveModuleUploader from 'resolve-module-uploader'

import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import cloudConfig from './config.cloud'
import testFunctionalConfig from './config.test-functional'

const launchMode = process.argv[2]

void (async () => {
  const moduleUploader = resolveModuleUploader({
    publicDirs: ['images', 'archives'],
    expireTime: 604800,
    jwtSecret: 'SECRETJWT'
  })

  const moduleAuth = resolveModuleAuth([
    {
      name: 'local-strategy',
      createStrategy: 'auth/create-strategy.js',
      logoutRoute: {
        path: 'logout',
        method: 'POST'
      },
      routes: [
        {
          path: 'register',
          method: 'POST',
          callback: 'auth/route-register-callback.js'
        },
        {
          path: 'login',
          method: 'POST',
          callback: 'auth/route-login-callback.js'
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
        moduleAuth,
        moduleUploader
      )

      await reset(resolveConfig, {
        dropEventStore: false,
        dropSnapshots: true,
        dropReadModels: true,
        dropSagas: true
      })

      await watch(resolveConfig)
      break
    }

    case 'build': {
      await build(
        merge(
          defaultResolveConfig,
          appConfig,
          prodConfig,
          moduleAuth,
          moduleUploader
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
          moduleAuth,
          moduleUploader
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
          moduleAuth,
          moduleUploader
        )
      )
      break
    }

    case 'test:functional': {
      const resolveConfig = merge(
        defaultResolveConfig,
        appConfig,
        testFunctionalConfig
      )

      await reset(resolveConfig, {
        dropEventStore: true,
        dropSnapshots: true,
        dropReadModels: true,
        dropSagas: true
      })

      await runTestcafe({
        resolveConfig,
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
