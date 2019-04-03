import path from 'path'
import webpack from 'webpack'

import showBuildInfo from './show_build_info'
import validateConfig from './validate_config'

import getWebpackLocalBrokerConfig from './get_webpack_local_broker_config'
import { processRegister } from './process_manager'

export default async resolveConfig =>
  new Promise(async (resolve, reject) => {
    validateConfig(resolveConfig)

    const webpackConfig = getWebpackLocalBrokerConfig(resolveConfig)

    const compiler = webpack([webpackConfig])

    await new Promise((resolve, reject) => {
      compiler.run((err, { stats }) => {
        stats.forEach(showBuildInfo.bind(null, err))

        const hasNoErrors = stats.reduce(
          (acc, val) => acc && (val != null && !val.hasErrors()),
          true
        )

        void (hasNoErrors ? resolve() : reject(stats.toString('')))
      })
    })

    const busBrokerPath = path.resolve(
      process.cwd(),
      path.join(
        resolveConfig.distDir,
        './common/local-entry/local-bus-broker.js'
      )
    )

    const server = processRegister(['node', busBrokerPath], {
      cwd: process.cwd(),
      maxRestarts: 0,
      kill: 5000,
      stdio: 'inherit'
    })

    server.start()

    server.on('crash', reject)
    server.on('stop', resolve)
  })
