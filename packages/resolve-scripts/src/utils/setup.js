import assignSettings from './assign_settings'
import resolveFile from './resolve_file'
import validateConfig from './validate_config'
import resolveConfigOrigin from '../../configs/resolve.config'
import deployOptions from '../../configs/deploy.options'

export default function setup(argv, env) {
  let localConfig = {}

  if (argv.config || env.CONFIG_PATH) {
    localConfig = require(resolveFile(argv.config || env.CONFIG_PATH))
  } else {
    try {
      localConfig = require(resolveFile('resolve.config.json'))
    } catch (e) {}
  }

  const resolveConfig = {
    ...resolveConfigOrigin,
    ...localConfig
  }

  assignSettings({ resolveConfig, deployOptions }, argv, env)

  validateConfig(resolveConfig)

  return { resolveConfig, deployOptions }
}
