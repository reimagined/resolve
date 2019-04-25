import fetch from 'isomorphic-fetch'
import prepareUrls from './prepare_urls'
import path from 'path'
import { processRegister } from './process_manager'
import validateConfig from './validate_config'
import getWebpackConfigs from './get_webpack_configs'
import getPeerDependencies from './get_peer_dependencies'
import webpack from 'webpack'
import fsExtra from 'fs-extra'
import showBuildInfo from './show_build_info'
import writePackageJsonsForAssemblies from './write_package_jsons_for_assemblies'
import copyEnvToDist from './copy_env_to_dist'
import merge from './merge'

const validOptions = [
  'dropEventStore',
  'dropSnapshots',
  'dropReadModels',
  'dropSagas'
]

const reset = (resolveConfig, options, adjustWebpackConfigs) =>
  new Promise(async (resolve, reject) => {
    try {
      if (options == null || options.constructor !== Object) {
        throw new Error('Invalid reset options')
      }
      let currentOptions = []
      for (const key of Object.keys(options)) {
        if (
          !validOptions.includes(key) ||
          options[key] == null ||
          options[key].constructor !== Boolean
        ) {
          throw new Error(`Invalid reset options: ${key}`)
        }
        currentOptions.push(`${key}=${options[key]}`)
      }

      validateConfig(resolveConfig)

      const config = JSON.parse(
        JSON.stringify(
          merge(resolveConfig, {
            apiHandlers: [
              {
                method: 'GET',
                path: 'reset-domain',
                controller: {
                  module:
                    'resolve-runtime/lib/common/handlers/reset-domain-handler.js',
                  options: {}
                }
              }
            ],
            eventBroker: {
              upstream: false
            }
          })
        )
      )

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

      const urls = prepareUrls('http', '0.0.0.0', config.port, config.rootPath)
      const baseUrl = urls.localUrlForBrowser
      const url = `${baseUrl}api/reset-domain?${currentOptions.join('&')}`

      while (true) {
        try {
          const response = await fetch(url)
          const text = await response.text()
          if (text === 'ok') break
        } catch (e) {}
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      await Promise.all([
        new Promise(resolve => server.stop(resolve)),
        new Promise(resolve => broker.stop(resolve))
      ])

      resolve()
    } catch (error) {
      reject(error)
    }
  })

export default reset
