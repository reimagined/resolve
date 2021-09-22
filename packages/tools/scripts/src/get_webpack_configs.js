import getWebpackClientConfigs from './get_webpack_client_configs'
import getWebpackCommonConfigs from './get_webpack_common_configs'
import getWebpackAlias from './get_webpack_alias'

const getWebpackConfigs = async ({
  resolveConfig,
  nodeModulesByAssembly,
  adjustWebpackConfigs,
}) => {
  const alias = getWebpackAlias()

  const webpackClientConfigs = getWebpackClientConfigs({
    resolveConfig,
    alias,
    nodeModulesByAssembly,
  })

  const webpackCommonConfigs = getWebpackCommonConfigs({
    resolveConfig,
    alias,
    nodeModulesByAssembly,
  })

  const configs = [...webpackClientConfigs, ...webpackCommonConfigs]

  if (typeof adjustWebpackConfigs === 'function') {
    await adjustWebpackConfigs(configs, {
      alias,
      nodeModulesByAssembly,
    })
  }

  for (const config of configs) {
    // .webpack.js should have precedence over other extensions
    if (Array.isArray(config.resolve.extensions)) {
      config.resolve.extensions = ['.webpack.js', ...config.resolve.extensions]
    }
  }

  return configs
}

export default getWebpackConfigs
