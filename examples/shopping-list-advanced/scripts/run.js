const {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge: rawMerge
} = require('resolve-scripts')

const devConfig = require('./config.dev')
const prodConfig = require('./config.prod')
const cloudConfig = require('./config.cloud')
const testFunctionalConfig = require('./config.test-functional')
const adjustWebpackConfigs = require('./config.adjust-webpack')
const appConfig = require('./config.app')
const createAuthModule = require('resolve-module-auth').default
const getLocalIp = require('my-local-ip')
const remotedev = require('remotedev-server')
const opn = require('opn')

const launchMode = process.argv[2]

const merge = (...configs) => {
  const config = rawMerge(...configs)
  return {
    ...config,
    customConstants: {
      ...config.customConstants,
      backend: {
        protocol: process.env.SHOPPING_LIST_PROTOCOL || 'http',
        hostname: process.env.SHOPPING_LIST_HOSTNAME || getLocalIp(),
        port: process.env.SHOPPING_LIST_PORT || config.port
      },
      remoteReduxDevTools: {
        hostname: process.env.SHOPPING_LIST_HOST || getLocalIp(),
        port: process.env.SHOPPING_LIST_PROTOCOL || 19042
      }
    }
  }
}

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
        }
      ],
      logoutRoute: {
        path: 'auth/local/logout',
        method: 'GET'
      }
    }
  ])

  switch (launchMode) {
    case 'dev': {
      const resolveConfig = merge(
        defaultResolveConfig,
        appConfig,
        devConfig,
        authModule
      )
      await watch(
        resolveConfig,
        adjustWebpackConfigs.bind(null, resolveConfig, { watch: true })
      )
      await remotedev({
        hostname: resolveConfig.customConstants.remoteReduxDevTools.hostname,
        port: resolveConfig.customConstants.remoteReduxDevTools.port,
        wsEngine: 'ws'
      })
      await opn(
        `http://${resolveConfig.customConstants.remoteReduxDevTools.hostname}:${
          resolveConfig.customConstants.remoteReduxDevTools.port
        }`
      )
      break
    }

    case 'build': {
      const resolveConfig = merge(
        defaultResolveConfig,
        appConfig,
        prodConfig,
        authModule
      )
      await build(
        resolveConfig,
        adjustWebpackConfigs.bind(null, resolveConfig, {})
      )
      break
    }

    case 'cloud': {
      const resolveConfig = merge(
        defaultResolveConfig,
        appConfig,
        cloudConfig,
        authModule
      )
      await build(
        resolveConfig,
        adjustWebpackConfigs.bind(null, resolveConfig, {})
      )
      break
    }

    case 'start': {
      const resolveConfig = merge(
        defaultResolveConfig,
        appConfig,
        prodConfig,
        authModule
      )
      await start(resolveConfig)
      break
    }

    case 'test:functional': {
      const resolveConfig = merge(
        defaultResolveConfig,
        appConfig,
        testFunctionalConfig,
        authModule
      )
      await runTestcafe({
        resolveConfig,
        adjustWebpackConfigs: adjustWebpackConfigs.bind(
          null,
          resolveConfig,
          {}
        ),
        functionalTestsDir: '../web/test/functional',
        browser: process.argv[3]
        // customArgs: ['-r', 'json:report.json']
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
