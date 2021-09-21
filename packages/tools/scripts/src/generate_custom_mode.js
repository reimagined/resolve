import fetch from 'isomorphic-fetch'
import prepareUrls from './prepare_urls'
import path from 'path'
import { checkRuntimeEnv, injectRuntimeEnv } from './declare_runtime_env'
import { processRegister } from './process_manager'
import validateConfig from './validate_config'
import getWebpackConfigs from './get_webpack_configs'
import getPeerDependencies from './get_peer_dependencies'
import webpack from 'webpack'
import fsExtra from 'fs-extra'
import showBuildInfo from './show_build_info'
import writePackageJsonsForAssemblies from './write_package_jsons_for_assemblies'
import copyEnvToDist from './copy_env_to_dist'
import { getLog } from './get-log'
import detectErrors from './detect_errors'

const log = getLog('custom')

const generateCustomMode = (getConfig, apiHandlerUrl, runAfterLaunch) => (
  resolveConfig,
  options,
  adjustWebpackConfigs
) =>
  new Promise(async (resolve, reject) => {
    try {
      log.debug(`Starting "${apiHandlerUrl}" mode`)
      const config = await getConfig(resolveConfig, options)
      validateConfig(config)

      const nodeModulesByAssembly = new Map()
      const webpackConfigs = await getWebpackConfigs({
        resolveConfig: config,
        nodeModulesByAssembly,
        adjustWebpackConfigs,
      })

      const peerDependencies = getPeerDependencies()

      const compiler = webpack(webpackConfigs)

      fsExtra.copySync(
        path.resolve(process.cwd(), config.staticDir),
        path.resolve(process.cwd(), config.distDir, './client')
      )

      await new Promise((resolve, reject) => {
        compiler.run((err, { stats }) => {
          console.log(' ') // eslint-disable-line no-console
          stats.forEach(showBuildInfo.bind(null, err))

          writePackageJsonsForAssemblies(
            config.distDir,
            nodeModulesByAssembly,
            peerDependencies
          )

          copyEnvToDist(config.distDir)

          const hasNoErrors = detectErrors(stats, false)

          void (hasNoErrors ? resolve() : reject(stats.toString('')))
        })
      })

      const serverPath = path.resolve(
        process.cwd(),
        path.join(config.distDir, './common/local-entry/local-entry.js')
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

      server.on('crash', reject)
      server.start()
      log.debug(`Server process pid: ${server.pid}`)

      const port = Number(
        checkRuntimeEnv(config.port)
          ? // eslint-disable-next-line no-new-func
            new Function(`return ${injectRuntimeEnv(config.port)}`)()
          : config.port
      )

      let lastError = null

      if (apiHandlerUrl != null) {
        const urls = prepareUrls('http', '0.0.0.0', port, config.rootPath)
        const baseUrl = urls.localUrlForBrowser
        const url = `${baseUrl}api/${apiHandlerUrl}`

        while (true) {
          try {
            const response = await fetch(url)

            const result = await response.text()
            if (result !== 'ok') {
              lastError = [
                `Error communicating with reSolve HTTP server at port ${port}`,
                `Multiple instances of reSolve applications may be trying to run on the same port`,
                `${response.status}: ${response.statusText}`,
                `${result}`,
              ].join('\n')
            }
            break
          } catch (e) {}
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      if (typeof runAfterLaunch === 'function') {
        try {
          await runAfterLaunch(options, config)
        } catch (error) {
          lastError = error
        }
      }

      await Promise.all([new Promise((resolve) => server.stop(resolve))])

      log.debug('Server was stopped')

      if (lastError != null) {
        throw lastError
      }

      resolve()
    } catch (error) {
      reject(error)
    }
  })

export default generateCustomMode
