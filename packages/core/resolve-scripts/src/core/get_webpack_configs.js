import getWebpackClientConfig from './get_webpack_client_config'
import getWebpackServerConfig from './get_webpack_server_config'
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

  const webpackServerConfig = getWebpackServerConfig({
    resolveConfig,
    deployOptions,
    env,
    alias
  })

  const configs = [webpackClientConfig, webpackServerConfig]

  resolveBuildConfig(configs, { resolveConfig, deployOptions, env })

  return configs
}

export default getWebpackConfigs
