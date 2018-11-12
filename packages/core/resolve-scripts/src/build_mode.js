import fsExtra from 'fs-extra'
import path from 'path'
import webpack from 'webpack'

import getWebpackConfigs from './get_webpack_configs'
import writePackageJsonsForAssemblies from './write_package_jsons_for_assemblies'
import getPeerDependencies from './get_peer_dependencies'
import showBuildInfo from './show_build_info'
import copyEnvToDist from './copy_env_to_dist'
import validateConfig from './validate_config'

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

  fsExtra.copySync(
    path.resolve(process.cwd(), resolveConfig.staticDir),
    path.resolve(process.cwd(), resolveConfig.distDir, './client')
  )

  return await new Promise((resolve, reject) => {
    compiler.run((err, { stats }) => {
      stats.forEach(showBuildInfo.bind(null, err))

      writePackageJsonsForAssemblies(
        resolveConfig.distDir,
        nodeModulesByAssembly,
        peerDependencies
      )

      copyEnvToDist(resolveConfig.distDir)

      const hasNoErrors = stats.reduce(
        (acc, val) => acc && (val != null && !val.hasErrors()),
        true
      )

      void (hasNoErrors ? resolve() : reject(stats.toString('')))
    })
  })
}
