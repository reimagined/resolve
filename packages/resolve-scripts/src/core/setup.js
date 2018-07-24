import fs from 'fs'
import path from 'path'
import envString from './env_string'
import { extractEnv, envKey } from 'json-env-extract'

import assignSettings from './assign_settings'
import resolveFile from './resolve_file'
import validateConfig from './validate_config'

import {
  resolveConfig as resolveConfigOrigin,
  deployOptions
} from './constants'

const setup = argv => {
  const env = process.env

  let localConfig = {}

  if (argv.config) {
    localConfig = extractEnv(
      envString(fs.readFileSync(resolveFile(argv.config)).toString(), env)
    )
  } else {
    const configPath = path.resolve(process.cwd(), 'resolve.config.json')
    if (fs.existsSync(configPath)) {
      localConfig = extractEnv(
        envString(fs.readFileSync(configPath).toString(), env)
      )
    }
  }

  const resolveConfig = {
    ...resolveConfigOrigin,
    ...localConfig
  }

  Object.defineProperty(resolveConfig, envKey, { value: localConfig[envKey] })

  assignSettings({ resolveConfig, deployOptions }, argv, env)

  validateConfig(resolveConfig)

  return { resolveConfig, deployOptions, env }
}

export default setup
