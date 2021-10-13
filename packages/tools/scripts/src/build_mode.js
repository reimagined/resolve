import * as fs from 'fs'
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
import detectErrors from './detect_errors'
import { getDeprecatedTarget } from './get-deprecated-target'

const log = getLog('build')

const buildMode = async (resolveConfig, adjustWebpackConfigs) => {
  log.debug('Starting "build" mode')
  validateConfig(resolveConfig)

  const nodeModulesByAssembly = new Map()

  const webpackConfigs = await getWebpackConfigs({
    resolveConfig,
    nodeModulesByAssembly,
    adjustWebpackConfigs,
  })

  const peerDependencies = getPeerDependencies()

  const compiler = webpack(webpackConfigs)

  fsExtra.copySync(
    path.resolve(process.cwd(), resolveConfig.staticDir),
    path.resolve(process.cwd(), resolveConfig.distDir, './client')
  )

  await new Promise((resolve, reject) => {
    compiler.run((err, { stats }) => {
      console.log(' ') // eslint-disable-line no-console
      stats.forEach(showBuildInfo.bind(null, err))

      writePackageJsonsForAssemblies(
        resolveConfig.distDir,
        nodeModulesByAssembly,
        peerDependencies
      )

      copyEnvToDist(resolveConfig.distDir)

      const hasNoErrors = detectErrors(stats, false)

      if (hasNoErrors) {
        resolve()
        log.debug('Building complete')
      } else {
        reject(stats.toString(''))
      }
    })
  })

  const npmRc = path.resolve(process.cwd(), '.npmrc')
  if (fs.existsSync(npmRc)) {
    fs.copyFileSync(
      npmRc,
      path.resolve(
        process.cwd(),
        resolveConfig.distDir,
        `./common/${getDeprecatedTarget(resolveConfig)}-entry/.npmrc`
      )
    )
  }
}

export default buildMode
