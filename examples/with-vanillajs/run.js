import {
  showBuildInfo,
  defaultResolveConfig,
  build,
  watch,
  merge,
  stop,
  reset
} from 'resolve-scripts'
import webpack from 'webpack'

import appConfig from './config.app'
import cloudConfig from './config.cloud'
import devConfig from './config.dev'

import getClientWebpackConfig from './client.webpack.config'

const compileClient = ({ resolveConfig, isWatch }) =>
  new Promise((resolve, reject) => {
    const compiler = webpack([
      getClientWebpackConfig({
        mode: resolveConfig.mode,
        distDir: resolveConfig.distDir
      })
    ])

    const isGoodStats = isWatch
      ? stats =>
          !stats.reduce(
            (acc, val) => acc || (val != null && val.hasErrors()),
            false
          )
      : stats =>
          stats.reduce(
            (acc, val) => acc && (val != null && !val.hasErrors()),
            true
          )

    const executor = isWatch
      ? compiler.watch.bind(compiler, { aggregateTimeout: 1000, poll: 1000 })
      : compiler.run.bind(compiler)

    executor((err, { stats }) => {
      stats.forEach(showBuildInfo.bind(null, err))
      if (!isGoodStats(stats)) {
        reject(stats.toString(''))
      } else {
        resolve()
      }
    })
  })

const launchMode = process.argv[2]

void (async () => {
  try {
    switch (launchMode) {
      case 'dev': {
        const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)

        await reset(resolveConfig, {
          dropEventStore: false,
          dropSnapshots: true,
          dropReadModels: true,
          dropSagas: true
        })

        await Promise.all([
          watch(resolveConfig),
          compileClient({ resolveConfig, isWatch: true })
        ])

        break
      }

      case 'cloud': {
        const resolveConfig = merge(
          defaultResolveConfig,
          appConfig,
          cloudConfig
        )

        await build(resolveConfig)

        await compileClient({ resolveConfig, isWatch: false })

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
