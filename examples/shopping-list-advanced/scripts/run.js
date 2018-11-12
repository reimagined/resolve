const {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge
} = require('resolve-scripts')

const devConfig = require('./config.dev')
const prodConfig = require('./config.prod')
const testFunctionalConfig = require('./config.test-functional')
const adjustWebpackConfigs = require('./config.adjust-webpack')
const appConfig = require('./config.app')
const createAuthModule = require('resolve-module-auth').default

const launchMode = process.argv[2]

void (async () => {
  const authModule = createAuthModule([
    {
      name: 'local-strategy',
      createStrategy: '../domain/lib/auth/create-strategy.js',
      routes: [
        {
          path: 'auth/local/register',
          method: 'POST',
          callback: '../domain/lib/auth/route-register-callback.js'
        },
        {
          path: 'auth/local/login',
          method: 'POST',
          callback: '../domain/lib/auth/route-login-callback.js'
        },
        {
          path: 'auth/local/logout',
          method: 'GET',
          callback: '../domain/lib/auth/route-logout-callback.js'
        }
      ]
    }
  ])

  switch (launchMode) {
    case 'dev': {
      const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig, authModule)
      await watch(
        resolveConfig,
        adjustWebpackConfigs.bind(null, resolveConfig, { watch: true })
      )
      break
    }

    case 'build': {
      const resolveConfig = merge(defaultResolveConfig, appConfig, prodConfig, authModule)
      await build(
        resolveConfig,
        adjustWebpackConfigs.bind(null, resolveConfig, {})
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
  process.exit(1)
})
