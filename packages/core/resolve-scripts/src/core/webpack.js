import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import respawn from 'respawn'
import webpack from 'webpack'

import getMockServer from './get_mock_server'
import getWebpackConfigs from './get_webpack_configs'
import writePackageJsonsForAssemblies from './write_package_jsons_for_assemblies'
import showBuildInfo from './show_build_info'
import copyEnvToDist from './copy_env_to_dist'
import setup from './setup'

export default async (options, resolveConfig, adjustWebpackConfigs) => {
  setup(resolveConfig, options)

  const nodeModulesByAssembly = new Map()

  const webpackConfigs = await getWebpackConfigs({
    resolveConfig,
    nodeModulesByAssembly,
    adjustWebpackConfigs
  })

  const compiler = webpack(webpackConfigs)

  const serverPath = path.resolve(__dirname, '../../dist/runtime/index.js')

  let resolveDonePromise, rejectDonePromise
  const donePromise = new Promise(
    (...args) => ([resolveDonePromise, rejectDonePromise] = args)
  )

  if (
    options.start &&
    !fs.existsSync(
      path.join(process.cwd(), resolveConfig.distDir, './assemblies.js')
    )
  ) {
    options.build = true
  }

  const server = options.start
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
  if (options.build) {
    fsExtra.copySync(
      path.resolve(process.cwd(), resolveConfig.staticDir),
      path.resolve(process.cwd(), resolveConfig.distDir, './client')
    )

    if (options.watch) {
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

          if (options.start) {
            const hasErrors = stats.reduce(
              (acc, val) => acc || (val != null && val.hasErrors()),
              false
            )
            if (hasErrors) {
              server.stop()
              rejectDonePromise()
            } else {
              if (server.status === 'running') {
                process.env.RESOLVE_SERVER_FIRST_START = 'false'
                server.stop(() => server.start())
              } else {
                server.start()
                resolveDonePromise()
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
        resolveDonePromise()

        if (options.start) {
          const hasNoErrors = stats.reduce(
            (acc, val) => acc && (val != null && !val.hasErrors()),
            true
          )
          if (hasNoErrors) {
            server.start()
            resolveDonePromise()
          }

          rejectDonePromise()
        }
      })
    }
  } else {
    server.start()
    resolveDonePromise()
  }

  await donePromise

  return {
    resolveConfig,
    webpackConfigs
  }
}
