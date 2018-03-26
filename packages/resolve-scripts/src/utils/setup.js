import fs from 'fs'
import path from 'path'
import JSON5 from 'json5'

import assignSettings from './assign_settings'
import resolveFile from './resolve_file'
import validateConfig from './validate_config'

export default function setup(argv, env) {
  let localConfig = '{}'

  if (argv.config || env.CONFIG_PATH) {
    localConfig = fs.readFileSync(resolveFile(argv.config || env.CONFIG_PATH))
  } else {
    try {
      localConfig = fs.readFileSync(resolveFile('resolve.config.json'))
    } catch (e) {}
  }

  localConfig = JSON5.parse(localConfig)

  const resolveConfig = {
    ...JSON5.parse(fs.readFileSync(path.resolve(__dirname, '../configs/resolve.config.json'))),
    ...localConfig
  }

  const deployOptions = JSON5.parse(fs.readFileSync(path.resolve(__dirname, '../configs/deploy.options.json')))

  assignSettings({ resolveConfig, deployOptions }, argv, env)

  validateConfig(resolveConfig)

  return { resolveConfig, deployOptions }
}
