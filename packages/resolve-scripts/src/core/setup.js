import fs from 'fs'
import path from 'path'
import JSON5 from 'json5'
import envString from 'env-string'

import assignSettings from './assign_settings'
import resolveFile from './resolve_file'
import validateConfig from './validate_config'

import resolveConfigOrigin from '../../configs/resolve.config.json'
import deployOptions from '../../configs/deploy.options.json'

const setup = (argv, env) => {
  let localConfig = {}

  if (argv.config || env.CONFIG_PATH) {
    localConfig = JSON5.parse(
      envString(
        fs.readFileSync(resolveFile(argv.config || env.CONFIG_PATH)).toString(),
        env
      )
    )
  } else {
    const configPath = path.resolve(process.cwd(), 'resolve.config.json')
    if (fs.existsSync(configPath)) {
      localConfig = JSON5.parse(
        envString(fs.readFileSync(configPath).toString(), env)
      )
    }
  }

  const resolveConfig = {
    ...resolveConfigOrigin,
    ...localConfig
  }

  assignSettings({ resolveConfig, deployOptions }, argv, env)

  validateConfig(resolveConfig)

  return { resolveConfig, deployOptions }
}

export default setup
