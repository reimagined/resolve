import fs from 'fs'

import resolveConfigOrigin from '../configs/resolve.config'
import deployOptionsOrigin from '../configs/deploy.options'
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

  localConfig = JSON.parse(localConfig)

  const resolveConfig = {
    ...JSON.parse(JSON.stringify(resolveConfigOrigin)),
    ...localConfig
  }

  const deployOptions = JSON.parse(JSON.stringify(deployOptionsOrigin))

  assignSettings({ resolveConfig, deployOptions }, argv, env)

  validateConfig(resolveConfig)

  return { resolveConfig, deployOptions }
}
