import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import respawn from 'respawn'
import webpack from 'webpack'

import setup from './setup'
import getMockServer from './get_mock_server'
import showBuildInfo from './show_build_info'
import copyEnvToDist from './copy_env_to_dist'
import getWebpackConfigs from './get_webpack_configs'
import getResolveBuildConfig from './get_resolve_build_config'
import writePackageJsonsForAssemblies from './write_package_jsons_for_assemblies'

export default argv => {
  const { resolveConfig, deployOptions, env } = setup(argv)

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

  const nodeModulesByAssembly = new Map()

  const webpackConfigs = getWebpackConfigs({
    resolveConfig,
    deployOptions,
    env,
    resolveBuildConfig,
    nodeModulesByAssembly
  })

  const compiler = webpack(webpackConfigs)

  const serverPath = path.resolve(__dirname, '../../dist/runtime/index.js')

  if (
    deployOptions.start &&
    !fs.existsSync(
      path.join(process.cwd(), resolveConfig.distDir, './assemblies.js')
    )
  ) {
    deployOptions.build = true
  }

  const server = deployOptions.start
    ? respawn(
        [serverPath, `--distDir=${JSON.stringify(resolveConfig.distDir)}`],
        {
          maxRestarts: 0,
          kill: 5000,
          stdio: 'inherit',
          fork: true
        }
      )
    : getMockServer()

  process.on('exit', () => {
    server.stop()
  })

  process.env.RESOLVE_SERVER_FIRST_START = 'true'
  if (deployOptions.build) {
    fsExtra.copySync(
      path.resolve(process.cwd(), resolveConfig.staticDir),
      path.resolve(process.cwd(), resolveConfig.distDir, './client')
    )

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
        (err, { stats }) => {
          stats.forEach(showBuildInfo.bind(null, err))

          writePackageJsonsForAssemblies(
            resolveConfig.distDir,
            nodeModulesByAssembly
          )

          copyEnvToDist(resolveConfig.distDir)

          if (deployOptions.start) {
            const hasErrors = stats.reduce(
              (acc, val) => acc || (val != null && val.hasErrors()),
              false
            )
            if (hasErrors) {
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
      compiler.run((err, { stats }) => {
        stats.forEach(showBuildInfo.bind(null, err))

        writePackageJsonsForAssemblies(
          resolveConfig.distDir,
          nodeModulesByAssembly
        )

        copyEnvToDist(resolveConfig.distDir)

        if (deployOptions.start) {
          const hasNoErrors = stats.reduce(
            (acc, val) => acc && (val != null && !val.hasErrors()),
            true
          )
          if (hasNoErrors) {
            server.start()
          }
        }
      })
    }
  } else {
    server.start()
  }
}
