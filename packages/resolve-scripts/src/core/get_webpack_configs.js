import fs from 'fs'
import path from 'path'

import getWebpackClientConfig from './get_webpack_client_config'
import getWebpackServerConfig from './get_webpack_server_config'

const getWebpackConfigs = ({
  resolveConfig,
  deployOptions,
  env,
  resolveBuildConfig
}) => {
  const alias = {}
  
  for(const filename of fs.readdirSync(path.resolve(__dirname, 'alias'))) {
    if(path.extname(filename) !== '.js') {
      continue
    }
    alias[path.basename(filename, '.js')] = path.resolve(__dirname, 'alias', filename)
  }
  
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
