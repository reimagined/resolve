import fs from 'fs'
import path from 'path'
import respawn from 'respawn'
import webpack from 'webpack'
import flat from 'flat'

import webpackClientConfig from './configs/webpack.client.config'
import webpackServerConfig from './configs/webpack.server.config'
import showBuildInfo from './utils/show_build_info'
import getRespawnConfig from './utils/get_respawn_config'
import setup from './utils/setup'
import createMockServer from './utils/create_mock_server'
import resolveFile from './utils/resolve_file'
import assignConfigPaths from './utils/assign_config_paths'

export default (argv, defaults = {}) => {
  Object.assign(process.env, Object.assign(defaults, process.env))

  const { resolveConfig, deployOptions } = setup(argv, process.env)

  if (argv.printConfig) {
    // eslint-disable-next-line
    console.log(
      JSON.stringify(
        {
          ...resolveConfig,
          ...deployOptions
        },
        null,
        3
      )
    )
    return
  }

  assignConfigPaths(resolveConfig)

  const serverIndexPath = resolveFile('server/index.js')
  const clientIndexPath = resolveConfig.index
  const serverDistDir = path.resolve(
    process.cwd(),
    resolveConfig.distDir,
    'server'
  )
  const clientDistDir = path.resolve(
    process.cwd(),
    resolveConfig.distDir,
    'client'
  )

  webpackClientConfig.entry = ['babel-regenerator-runtime', clientIndexPath]
  webpackClientConfig.output.path = clientDistDir
  webpackClientConfig.mode = deployOptions.mode

  webpackServerConfig.entry = ['babel-regenerator-runtime', serverIndexPath]
  webpackServerConfig.output.path = serverDistDir
  webpackServerConfig.mode = deployOptions.mode

  const defineObject = {}
  for (const key of Object.keys(deployOptions)) {
    defineObject[`$resolve.${key}`] = JSON.stringify(deployOptions[key])
  }
  for (let maxDepth = 1; maxDepth < 5; maxDepth++) {
    const flatConfig = flat(resolveConfig, { maxDepth })
    for (const key of Object.keys(flatConfig)) {
      defineObject[`$resolve.${key}`] = JSON.stringify(flatConfig[key])
    }
  }

  const definePlugin = new webpack.DefinePlugin(defineObject)

  webpackClientConfig.plugins.push(definePlugin)
  webpackServerConfig.plugins.push(definePlugin)

  const compiler = webpack([webpackClientConfig, webpackServerConfig])

  const serverPath = `${webpackServerConfig.output.path}/${
    webpackServerConfig.output.filename
  }`

  if (deployOptions.start && !fs.existsSync(serverPath)) {
    deployOptions.build = true
  }

  const server = deployOptions.start
    ? respawn(getRespawnConfig(serverPath), {
        maxRestarts: 0,
        kill: 5000,
        stdio: 'inherit'
      })
    : createMockServer()

  process.on('exit', () => {
    server.stop()
  })

  process.env.RESOLVE_SERVER_FIRST_START = true
  if (deployOptions.build) {
    if (deployOptions.watch) {
      const stdin = process.openStdin()
      stdin.addListener('data', data => {
        if (data.toString().indexOf('rs') !== -1) {
          process.env.RESOLVE_SERVER_FIRST_START = false
          server.stop(() => server.start())
        }
      })
      compiler.watch(
        {
          aggregateTimeout: 1000,
          poll: 1000
        },
        (err, { stats: [clientStats, serverStats] }) => {
          showBuildInfo(webpackClientConfig, err, clientStats)
          showBuildInfo(webpackServerConfig, err, serverStats)
          if (deployOptions.start) {
            if (
              (serverStats && serverStats.hasErrors()) ||
              (clientStats && clientStats.hasErrors())
            ) {
              server.stop()
            } else {
              if (server.status === 'running') {
                process.env.RESOLVE_SERVER_FIRST_START = false
                server.stop(() => server.start())
              } else {
                server.start()
              }
            }
          }
        }
      )
    } else {
      compiler.run((err, { stats: [clientStats, serverStats] }) => {
        showBuildInfo(webpackClientConfig, err, clientStats)
        showBuildInfo(webpackServerConfig, err, serverStats)
        if (deployOptions.start) {
          if (
            serverStats &&
            clientStats &&
            !serverStats.hasErrors() &&
            !clientStats.hasErrors()
          ) {
            server.start()
          }
        }
      })
    }
  } else {
    server.start()
  }
}
