import fsExtra from 'fs-extra'
import path from 'path'
import respawn from 'respawn'
import webpack from 'webpack'

import getWebpackConfigs from './get_webpack_configs'
import writePackageJsonsForAssemblies from './write_package_jsons_for_assemblies'
import getPeerDependencies from './get_peer_dependencies'
import showBuildInfo from './show_build_info'
import copyEnvToDist from './copy_env_to_dist'
import validateConfig from './validate_config'

import openBrowser from './open_browser'

export default async (resolveConfig, adjustWebpackConfigs) => {
  validateConfig(resolveConfig)

  const nodeModulesByAssembly = new Map()

  const webpackConfigs = await getWebpackConfigs({
    resolveConfig,
    nodeModulesByAssembly,
    adjustWebpackConfigs
  })

  const peerDependencies = getPeerDependencies()

  const compiler = webpack(webpackConfigs)

  const serverPath = path.resolve(
    process.cwd(),
    path.join(resolveConfig.distDir, './common/local-entry/local-entry.js')
  )

  const server = respawn(['node', serverPath], {
    cwd: process.cwd(),
    maxRestarts: 0,
    kill: 5000,
    stdio: 'inherit'
  })

  process.on('exit', () => {
    server.stop()
  })

  process.env.RESOLVE_SERVER_FIRST_START = 'true'
  process.env.RESOLVE_SERVER_OPEN_BROWSER = 'true'

  fsExtra.copySync(
    path.resolve(process.cwd(), resolveConfig.staticDir),
    path.resolve(process.cwd(), resolveConfig.distDir, './client')
  )

  const stdin = process.openStdin()
  stdin.addListener('data', data => {
    if (data.toString().indexOf('rs') !== -1) {
      process.env.RESOLVE_SERVER_FIRST_START = 'false'
      server.stop(() => server.start())
    }
  })

  return await new Promise((resolve, reject) =>
    compiler.watch(
      {
        aggregateTimeout: 1000,
        poll: 1000
      },
      (err, { stats }) => {
        stats.forEach(showBuildInfo.bind(null, err))

        writePackageJsonsForAssemblies(
          resolveConfig.distDir,
          nodeModulesByAssembly,
          peerDependencies
        )

        copyEnvToDist(resolveConfig.distDir)

        const hasErrors = stats.reduce(
          (acc, val) => acc || (val != null && val.hasErrors()),
          false
        )

        if (hasErrors) {
          server.stop()
          reject('')
        } else {
          if (server.status === 'running') {
            process.env.RESOLVE_SERVER_FIRST_START = 'false'
            server.stop(() => server.start())
          } else {
            server.start()

            const isOpenBrowser =
              process.env.RESOLVE_SERVER_OPEN_BROWSER === 'true'
            const serverFirstStart =
              process.env.RESOLVE_SERVER_FIRST_START === 'true'
            if (isOpenBrowser && serverFirstStart) {
              openBrowser(resolveConfig.port, resolveConfig.rootPath).catch(
                () => {}
              )
            }

            resolve()
          }
        }
      }
    )
  )
}
