import fs from 'fs'
import respawn from 'respawn'
import webpack from 'webpack'

import getResolveBuildConfig from './get_resolve_build_config'
import getWebpackConfigs from './get_webpack_configs'
import showBuildInfo from './show_build_info'
import setup from './setup'
import getMockServer from './get_mock_server'
import assignConfigPaths from './assign_config_paths'

export default (argv, envDefaults = {}) => {
  const { resolveConfig, deployOptions, env } = setup(argv, envDefaults)

  if (argv.printConfig) {
    // eslint-disable-next-line
    console.log(
      JSON.stringify(
        {
          ...resolveConfig,
          deployOptions
        },
        null,
        3
      )
    )
    return
  }

  const resolveBuildConfig = getResolveBuildConfig(argv, env)

  assignConfigPaths(resolveConfig)

  const [
    webpackClientConfig,
    webpackServerConfig,
    ...otherWebpackConfigs
  ] = getWebpackConfigs({
    resolveConfig,
    deployOptions,
    env,
    resolveBuildConfig
  })

  const compiler = webpack([
    webpackClientConfig,
    webpackServerConfig,
    ...otherWebpackConfigs
  ])

  const serverPath = `${webpackServerConfig.output.path}/${
    webpackServerConfig.output.filename
  }`

  if (deployOptions.start && !fs.existsSync(serverPath)) {
    deployOptions.build = true
  }

  const server = deployOptions.start
    ? respawn([serverPath], {
        maxRestarts: 0,
        kill: 5000,
        stdio: 'inherit',
        fork: true
      })
    : getMockServer()

  process.on('exit', () => {
    server.stop()
  })

  process.env.RESOLVE_SERVER_FIRST_START = 'true'
  if (deployOptions.build) {
    if (deployOptions.watch) {
      const stdin = process.openStdin()
      stdin.addListener('data', data => {
        if (data.toString().indexOf('rs') !== -1) {
          process.env.RESOLVE_SERVER_FIRST_START = 'false'
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
                process.env.RESOLVE_SERVER_FIRST_START = 'false'
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
