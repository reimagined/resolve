import getWebpackClientConfig from './get_webpack_client_config'
import getWebpackCommonConfigs from './get_webpack_common_configs'
import getWebpackAlias from './get_webpack_alias'

const getWebpackConfigs = ({
  resolveConfig,
  deployOptions,
  env,
  resolveBuildConfig,
  nodeModulesByAssembly
}) => {
  const alias = getWebpackAlias()

  const webpackClientConfig = getWebpackClientConfig({
    resolveConfig,
    deployOptions,
    env,
    alias,
    nodeModulesByAssembly
  })

  const webpackCommonConfigs = getWebpackCommonConfigs({
    resolveConfig,
    deployOptions,
    env,
    alias,
    nodeModulesByAssembly
  })

  const configs = [webpackClientConfig, ...webpackCommonConfigs]

  resolveBuildConfig(configs, { resolveConfig, deployOptions, env })

  return configs
}

export default getWebpackConfigs
