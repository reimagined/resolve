import fsExtra from 'fs-extra'
import path from 'path'
import webpack from 'webpack'

import getWebpackConfigs from './get_webpack_configs'
import writePackageJsonsForAssemblies from './write_package_jsons_for_assemblies'
import { checkRuntimeEnv, injectRuntimeEnv } from './declare_runtime_env'
import getPeerDependencies from './get_peer_dependencies'
import showBuildInfo from './show_build_info'
import copyEnvToDist from './copy_env_to_dist'
import validateConfig from './validate_config'
import openBrowser from './open_browser'
import { processRegister } from './process_manager'

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

  const server = processRegister(['node', serverPath], {
    cwd: process.cwd(),
    maxRestarts: 0,
    kill: 5000,
    stdio: 'inherit'
  })

  let broker = null
  if (resolveConfig.eventBroker.launchBroker) {
    const brokerPath = path.resolve(
      process.cwd(),
      path.join(
        resolveConfig.distDir,
        './common/local-entry/local-bus-broker.js'
      )
    )

    broker = processRegister(['node', brokerPath], {
      cwd: process.cwd(),
      maxRestarts: 0,
      kill: 5000,
      stdio: 'inherit'
    })
  }

  let uploader = null
  if (
    resolveConfig.hasOwnProperty('uploadAdapter') &&
    resolveConfig.uploadAdapter.hasOwnProperty('options') &&
    resolveConfig.uploadAdapter.options.hasOwnProperty('launchServer') &&
    resolveConfig.uploadAdapter.options.launchServer
  ) {
    const uploaderPath = path.resolve(
      process.cwd(),
      path.join(
        resolveConfig.distDir,
        './common/local-entry/local-s3-server.js'
      )
    )

    uploader = processRegister(['node', uploaderPath], {
      cwd: process.cwd(),
      maxRestarts: 0,
      kill: 5000,
      stdio: 'inherit'
    })
  }

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

  return await new Promise(() => {
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

        const port = Number(
          checkRuntimeEnv(resolveConfig.port)
            ? // eslint-disable-next-line no-new-func
              new Function(`return ${injectRuntimeEnv(resolveConfig.port)}`)()
            : resolveConfig.port
        )

        if (hasErrors) {
          server.stop()
        } else {
          if (server.status === 'running') {
            process.env.RESOLVE_SERVER_FIRST_START = 'false'
            server.stop(() => server.start())
          } else {
            if (resolveConfig.eventBroker.launchBroker) {
              broker.start()
            }
            if (uploader != null) {
              uploader.start()
            }
            server.start()

            const isOpenBrowser =
              process.env.RESOLVE_SERVER_OPEN_BROWSER === 'true'
            const serverFirstStart =
              process.env.RESOLVE_SERVER_FIRST_START === 'true'
            if (isOpenBrowser && serverFirstStart) {
              openBrowser(port, resolveConfig.rootPath).catch(() => {})
            }
          }
        }
      }
    )
  })
}
