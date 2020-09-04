import fsExtra from 'fs-extra'
import path from 'path'
import webpack from 'webpack'
import getLog from './getLog'

import getWebpackConfigs from './get_webpack_configs'
import writePackageJsonsForAssemblies from './write_package_jsons_for_assemblies'
import { checkRuntimeEnv, injectRuntimeEnv } from './declare_runtime_env'
import getPeerDependencies from './get_peer_dependencies'
import showBuildInfo from './show_build_info'
import copyEnvToDist from './copy_env_to_dist'
import validateConfig from './validate_config'
import openBrowser from './open_browser'
import { processRegister } from './process_manager'

const log = getLog('watch')

export default async (resolveConfig, adjustWebpackConfigs) => {
  log.debug('Starting "watch" mode')
  validateConfig(resolveConfig)

  const nodeModulesByAssembly = new Map()

  const webpackConfigs = await getWebpackConfigs({
    resolveConfig,
    nodeModulesByAssembly,
    adjustWebpackConfigs,
  })

  const peerDependencies = getPeerDependencies()

  const compiler = webpack(webpackConfigs)

  const serverPath = path.resolve(
    process.cwd(),
    path.join(resolveConfig.distDir, './common/local-entry/local-entry.js')
  )

  const resolveLaunchId = Math.floor(Math.random() * 1000000000)

  const server = processRegister(['node', serverPath], {
    cwd: process.cwd(),
    maxRestarts: 0,
    kill: 5000,
    stdio: 'inherit',
    env: {
      ...process.env,
      RESOLVE_LAUNCH_ID: resolveLaunchId,
    },
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
      stdio: 'inherit',
      env: {
        ...process.env,
        RESOLVE_LAUNCH_ID: resolveLaunchId,
      },
    })
  }

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
              log.debug(`Bus broker process pid: ${broker.pid}`)
            }
            server.start()
            log.debug(`Server process pid: ${server.pid}`)

            const isOpenBrowser =
              process.env.RESOLVE_SERVER_OPEN_BROWSER === 'true'
            const serverFirstStart =
              process.env.RESOLVE_SERVER_FIRST_START === 'true'
            if (isOpenBrowser && serverFirstStart) {
              log.debug('Opening browser')
              openBrowser(port, resolveConfig.rootPath).catch(() => {})
              log.debug('Browser was opened')
            }
          }
        }
      }
    )
  })
}
