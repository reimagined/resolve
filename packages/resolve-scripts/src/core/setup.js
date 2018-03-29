import fs from 'fs'
import path from 'path'
import JSON5 from 'json5'

import assignSettings from './assign_settings'
import resolveFile from './resolve_file'
import validateConfig from './validate_config'

const resolveConfigOrigin = require('../../configs/resolve.config.json')
const deployOptions = require('../../configs/deploy.options.json')

export default function setup(argv, env) {
  let localConfig = {}

  if (argv.config || env.CONFIG_PATH) {
    localConfig = JSON5.parse(
      fs.readFileSync(resolveFile(argv.config || env.CONFIG_PATH))
    )
  } else {
    const configPath = path.resolve(process.cwd(), 'resolve.config.json')
    if (fs.existsSync(configPath)) {
      localConfig = JSON5.parse(fs.readFileSync(configPath))
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
