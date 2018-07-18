import getWebpackClientConfig from './get_webpack_client_config'
import getWebpackCommonConfig from './get_webpack_common_config'
import getWebpackAlias from './get_webpack_alias'

const getWebpackConfigs = ({
  resolveConfig,
  deployOptions,
  env,
  resolveBuildConfig
}) => {
  const alias = getWebpackAlias()

  const webpackClientConfig = getWebpackClientConfig({
    resolveConfig,
    deployOptions,
    env,
    alias
  })

  const webpackCommonConfig = getWebpackCommonConfig({
    resolveConfig,
    deployOptions,
    env,
    alias
  })

  const configs = [webpackClientConfig, webpackCommonConfig]

  resolveBuildConfig(configs, { resolveConfig, deployOptions, env })

  return configs
}

export default getWebpackConfigs
