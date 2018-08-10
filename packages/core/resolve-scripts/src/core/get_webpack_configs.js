import getWebpackClientConfig from './get_webpack_client_config'
import getWebpackCommonConfigs from './get_webpack_common_configs'
import getWebpackAlias from './get_webpack_alias'

const getWebpackConfigs = async ({
  resolveConfig,
  nodeModulesByAssembly,
  adjustWebpackConfigs
}) => {
  const alias = getWebpackAlias()

  const webpackClientConfig = getWebpackClientConfig({
    resolveConfig,
    alias,
    nodeModulesByAssembly
  })

  const webpackCommonConfigs = getWebpackCommonConfigs({
    resolveConfig,
    alias,
    nodeModulesByAssembly
  })

  const configs = [webpackClientConfig, ...webpackCommonConfigs]

  if (typeof adjustWebpackConfigs === 'function') {
    await adjustWebpackConfigs(configs, {
      alias,
      nodeModulesByAssembly
    })
  }

  return configs
}

export default getWebpackConfigs
