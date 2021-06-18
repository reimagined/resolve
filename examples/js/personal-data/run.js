import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge,
  reset,
} from '@resolve-js/scripts'
import resolveModuleAuth from '@resolve-js/module-auth'
import resolveModuleAdmin from '@resolve-js/module-admin'
import resolveModuleUploader from '@resolve-js/module-uploader'
import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import cloudConfig from './config.cloud'
import testFunctionalConfig from './config.test-functional'
import adjustWebpackConfigs from './config.adjust-webpack'
const launchMode = process.argv[2]
void (async () => {
  const moduleUploader = resolveModuleUploader({
    publicDirs: ['images', 'archives'],
    expireTime: 604800,
    jwtSecret: 'SECRETJWT',
  })
  const moduleAuth = resolveModuleAuth([
    {
      name: 'local-strategy',
      createStrategy: 'auth/create-strategy.js',
      logoutRoute: {
        path: 'logout',
        method: 'POST',
      },
      routes: [
        {
          path: 'register',
          method: 'POST',
          callback: 'auth/route-register-callback.js',
        },
        {
          path: 'login',
          method: 'POST',
          callback: 'auth/route-login-callback.js',
        },
      ],
    },
  ])
  const baseConfig = merge(
    defaultResolveConfig,
    appConfig,
    moduleAuth,
    moduleUploader
  )
  switch (launchMode) {
    case 'dev': {
      const resolveConfig = merge(baseConfig, devConfig)
      await watch(resolveConfig, adjustWebpackConfigs)
      break
    }
    case 'reset': {
      const resolveConfig = merge(baseConfig, devConfig)
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
      await build(merge(baseConfig, prodConfig), adjustWebpackConfigs)
      break
    }
    case 'start': {
      await start(merge(baseConfig, prodConfig), adjustWebpackConfigs)
      break
    }
    case 'cloud': {
      await build(merge(baseConfig, cloudConfig), adjustWebpackConfigs)
      break
    }
    case 'test:e2e': {
      const resolveAdmin = resolveModuleAdmin()
      const resolveConfig = merge(
        baseConfig,
        resolveAdmin,
        testFunctionalConfig
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
        customArgs: ['--skip-js-errors', '--stop-on-first-fail'],
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
