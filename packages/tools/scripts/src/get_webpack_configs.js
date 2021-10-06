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
    const extensions = config.resolve.extensions

    if (Array.isArray(extensions) && extensions.length > 0) {
      const index = extensions.findIndex((ext) => ext === '.webpack.js')
      if (index >= 0) {
        extensions.splice(index, 1)
      }
      if (extensions[0] !== '.webpack.js') {
        config.resolve.extensions = ['.webpack.js', ...extensions]
      }
    }
  }

  return configs
}

export default getWebpackConfigs
