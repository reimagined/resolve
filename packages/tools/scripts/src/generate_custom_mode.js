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

const generateCustomMode = (getConfig, apiHandlerUrl, runAfterLaunch) => (
  resolveConfig,
  options,
  adjustWebpackConfigs
) =>
  new Promise(async (resolve, reject) => {
    const log = getLog(`start:${apiHandlerUrl}`)

    try {
      log.debug(`validating framework config`)
      const config = await getConfig(resolveConfig, options)
      validateConfig(config)

      log.debug(`requesting webpack configs`)
      const nodeModulesByAssembly = new Map()
      const webpackConfigs = await getWebpackConfigs({
        resolveConfig: config,
        nodeModulesByAssembly,
        adjustWebpackConfigs,
      })

      const peerDependencies = getPeerDependencies()

      log.debug(`creating webpack compiler`)
      const compiler = webpack(webpackConfigs)

      log.debug(`injecting static files to distribution`)
      fsExtra.copySync(
        path.resolve(process.cwd(), config.staticDir),
        path.resolve(process.cwd(), config.distDir, './client')
      )

      log.debug(`executing webpack compilation`)
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
      log.debug(`webpack compilation succeeded`)

      const serverPath = path.resolve(
        process.cwd(),
        path.join(config.distDir, './common/local-entry/local-entry.js')
      )
      log.debug(`backend entry: ${serverPath}`)

      const resolveLaunchId = Math.floor(Math.random() * 1000000000)

      log.debug(`registering backend server node process`)
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
      log.debug(`server process started with pid: ${server.pid}`)

      const {
        runtime: {
          options: { port: portSource, host: hostSource },
        },
      } = config
      const port = Number(
        checkRuntimeEnv(portSource)
          ? // eslint-disable-next-line no-new-func
            new Function(`return ${injectRuntimeEnv(portSource)}`)()
          : config.port
      )
      const host = checkRuntimeEnv(hostSource)
        ? // eslint-disable-next-line no-new-func
          new Function(`return ${injectRuntimeEnv(hostSource)}`)()
        : config.port

      log.debug(`resolve host "${host}", port "${port}"`)

      let lastError = null

      if (apiHandlerUrl != null) {
        const urls = prepareUrls('http', host, port, config.rootPath)
        const baseUrl = urls.localUrlForBrowser
        const url = `${baseUrl}api/${apiHandlerUrl}`

        log.debug(`target API url to fetch ${url}`)

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
