import fsExtra from 'fs-extra'
import path from 'path'
import webpack from 'webpack'
import { getLog } from './get-log'

import getWebpackConfigs from './get_webpack_configs'
import writePackageJsonsForAssemblies from './write_package_jsons_for_assemblies'
import getPeerDependencies from './get_peer_dependencies'
import showBuildInfo from './show_build_info'
import copyEnvToDist from './copy_env_to_dist'
import validateConfig from './validate_config'
import openBrowser from './open_browser'
import { processRegister } from './process_manager'
import adjustResolveConfig from './adjust-resolve-config'
import detectErrors from './detect_errors'
import getEntryOptions from './get_entry_options'

const log = getLog('watch')

const watchMode = async (resolveConfig, adjustWebpackConfigs) => {
  log.debug('Starting "watch" mode')

  await adjustResolveConfig(resolveConfig)

  validateConfig(resolveConfig)

  const nodeModulesByAssembly = new Map()

  const webpackConfigs = await getWebpackConfigs({
    resolveConfig,
    nodeModulesByAssembly,
    adjustWebpackConfigs,
  })

  const peerDependencies = getPeerDependencies()
  const compiler = webpack(webpackConfigs)
  const {
    activeRuntimeModule,
    runtimeEntry,
    activeRuntimeOptions,
  } = getEntryOptions(resolveConfig)
  const resolveLaunchId = Math.floor(Math.random() * 1000000000)

  const server = processRegister(
    ['node', activeRuntimeModule, runtimeEntry, activeRuntimeOptions],
    {
      cwd: process.cwd(),
      maxRestarts: 0,
      kill: 5000,
      stdio: 'inherit',
      env: {
        ...process.env,
        RESOLVE_LAUNCH_ID: resolveLaunchId,
      },
    }
  )

  process.env.RESOLVE_SERVER_FIRST_START = 'true'
  process.env.RESOLVE_SERVER_OPEN_BROWSER = 'true'

  fsExtra.copySync(
    path.resolve(process.cwd(), resolveConfig.staticDir),
    path.resolve(process.cwd(), resolveConfig.distDir, './client')
  )

  const stdin = process.openStdin()
  stdin.addListener('data', (data) => {
    if (data.toString().indexOf('rs') !== -1) {
      process.env.RESOLVE_SERVER_FIRST_START = 'false'
      server.stop(() => server.start())
    }
  })

  return await new Promise(() => {
    compiler.watch(
      {
        aggregateTimeout: 1000,
        poll: 1000,
      },
      (err, { stats }) => {
        console.log(' ') // eslint-disable-line no-console
        stats.forEach(showBuildInfo.bind(null, err))

        writePackageJsonsForAssemblies(
          resolveConfig.distDir,
          nodeModulesByAssembly,
          peerDependencies
        )

        copyEnvToDist(resolveConfig.distDir)

        const hasErrors = detectErrors(stats, true)
        const { host, port } = JSON.parse(activeRuntimeOptions)

        if (hasErrors) {
          server.stop()
        } else {
          if (server.status === 'running') {
            process.env.RESOLVE_SERVER_FIRST_START = 'false'
            server.stop(() => server.start())
          } else {
            server.start()
            log.debug(`Server process pid: ${server.pid}`)

            const isOpenBrowser =
              process.env.RESOLVE_SERVER_OPEN_BROWSER === 'true'
            const serverFirstStart =
              process.env.RESOLVE_SERVER_FIRST_START === 'true'
            if (isOpenBrowser && serverFirstStart) {
              log.debug('Opening browser')
              openBrowser(host, port, resolveConfig.rootPath).catch(() => {})
            }
          }
        }
      }
    )
  })
}

export default watchMode
