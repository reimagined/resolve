import {
  showBuildInfo,
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge,
  stop,
  reset,
  importEventStore,
  exportEventStore
} from 'resolve-scripts'
import resolveModuleComments from 'resolve-module-comments'
import resolveModuleAuth from 'resolve-module-auth'

import webpack from 'webpack'
import getWebpackConfigs from './webpack.config'

import appConfig from './config.app'
import cloudConfig from './config.cloud'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test-functional'

import runImport from './import'

const launchMode = process.argv[2]

void (async () => {
  try {
    const moduleComments = resolveModuleComments({
      aggregateName: 'Comment',
      readModelName: 'Comments',
      readModelConnectorName: 'comments',
      reducerName: 'comments'
    })

    const moduleAuth = resolveModuleAuth([
      {
        name: 'local-strategy',
        createStrategy: 'auth/create_strategy.js',
        logoutRoute: {
          path: 'logout',
          method: 'POST'
        },
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
          }
        ]
      }
    ])

    const baseConfig = merge(
      defaultResolveConfig,
      appConfig,
      moduleComments,
      moduleAuth
    )

    switch (launchMode) {
      case 'dev': {
        const resolveConfig = merge(baseConfig, devConfig)
        await reset(resolveConfig, {
          dropEventStore: false,
          dropSnapshots: true,
          dropReadModels: true,
          dropSagas: true
        })

        const clientCompiler = webpack(
          getWebpackConfigs({
            mode: 'development',
            distDir: resolveConfig.distDir
          })
        )

        const clientCompiling = new Promise((resolve, reject) => {
          clientCompiler.watch({ aggregateTimeout: 1000, poll: 1000 }, (err, { stats }) => {
            stats.forEach(showBuildInfo.bind(null, err))
            const hasErrors = stats.reduce(
              (acc, val) => acc || (val != null && val.hasErrors()),
              false
            )
            void (hasNoErrors ? resolve() : reject(stats.toString('')))
          })
        })

        await Promise.all([watch(resolveConfig), clientCompiling])
        break
      }

      default: {
        throw new Error('Unknown option')
      }
    }
    await stop()
  } catch (error) {
    await stop(error)
  }
})()
