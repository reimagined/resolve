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

const generateCustomMode = (getConfig, apiHandlerUrl, runAfterLaunch) => (
  resolveConfig,
  options,
  adjustWebpackConfigs
) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = await getConfig(resolveConfig, options)
      validateConfig(config)

      const nodeModulesByAssembly = new Map()
      const webpackConfigs = await getWebpackConfigs({
        resolveConfig: config,
        nodeModulesByAssembly,
        adjustWebpackConfigs
      })

      const peerDependencies = getPeerDependencies()

      const compiler = webpack(webpackConfigs)

      fsExtra.copySync(
        path.resolve(process.cwd(), config.staticDir),
        path.resolve(process.cwd(), config.distDir, './client')
      )

      await new Promise((resolve, reject) => {
        compiler.run((err, { stats }) => {
          stats.forEach(showBuildInfo.bind(null, err))

          writePackageJsonsForAssemblies(
            config.distDir,
            nodeModulesByAssembly,
            peerDependencies
          )

          copyEnvToDist(config.distDir)

          const hasNoErrors = stats.reduce(
            (acc, val) => acc && (val != null && !val.hasErrors()),
            true
          )

          void (hasNoErrors ? resolve() : reject(stats.toString('')))
        })
      })

      const serverPath = path.resolve(
        process.cwd(),
        path.join(config.distDir, './common/local-entry/local-entry.js')
      )

      const server = processRegister(['node', serverPath], {
        cwd: process.cwd(),
        maxRestarts: 0,
        kill: 5000,
        stdio: 'inherit'
      })

      server.on('crash', reject)
      server.start()

      let broker = { stop: callback => callback() }
      if (config.eventBroker.launchBroker) {
        const brokerPath = path.resolve(
          process.cwd(),
          path.join(config.distDir, './common/local-entry/local-bus-broker.js')
        )

        broker = processRegister(['node', brokerPath], {
          cwd: process.cwd(),
          maxRestarts: 0,
          kill: 5000,
          stdio: 'inherit'
        })

        broker.on('crash', reject)
        broker.start(resolve)
      }

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
            const text = await response.text()
            if (text !== 'ok') {
              lastError = text
            }
            break
          } catch (e) {}
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      if (typeof runAfterLaunch === 'function') {
        try {
          await runAfterLaunch(options, config)
        } catch (error) {
          lastError = error
        }
      }

      await Promise.all([
        new Promise(resolve => server.stop(resolve)),
        new Promise(resolve => broker.stop(resolve))
      ])

      if (lastError != null) {
        throw lastError
      }

      resolve()
    } catch (error) {
      reject(error)
    }
  })

export default generateCustomMode
