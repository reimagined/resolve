import getWebpackClientConfig from './get_webpack_client_config'
import getWebpackServerConfig from './get_webpack_server_config'

const getWebpackConfigs = ({
  resolveConfig,
  deployOptions,
  env,
  resolveBuildConfig
}) => {
  const webpackClientConfig = getWebpackClientConfig({
    resolveConfig,
    deployOptions,
    env
  })

  const webpackServerConfig = getWebpackServerConfig({
    resolveConfig,
    deployOptions,
    env
  })

  const configs = [webpackClientConfig, webpackServerConfig]

  resolveBuildConfig(configs, { resolveConfig, deployOptions, env })

  return configs
}

export default getWebpackConfigs
