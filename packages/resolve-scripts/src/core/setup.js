import fs from 'fs'
import path from 'path'

import assignSettings from './assign_settings'
import resolveFile from './resolve_file'
import validateConfig from './validate_config'
import parseResolveConfigJson from './parse_resolve_config_json'
import flatEnvVariables from './flat_env_variables'

import {
  resolveConfig as resolveConfigOrigin,
  deployOptions
} from './constants'

const setup = argv => {
  const env = process.env

  let localConfig = {}

  if (argv.config || env.CONFIG_PATH) {
    localConfig = parseResolveConfigJson(
      fs.readFileSync(resolveFile(argv.config)).toString(),
      { env, deployOptions }
    )
  } else {
    const configPath = path.resolve(process.cwd(), 'resolve.config.json')
    if (fs.existsSync(configPath)) {
      localConfig = parseResolveConfigJson(
        fs.readFileSync(resolveFile(configPath)).toString(),
        { env, deployOptions }
      )
    }
  }

  const resolveConfig = {
    ...resolveConfigOrigin,
    ...localConfig
  }

  assignSettings({ resolveConfig, deployOptions }, argv, env)

  validateConfig(resolveConfig)

  flatEnvVariables(resolveConfig)

  return { resolveConfig, deployOptions, env }
}

export default setup
