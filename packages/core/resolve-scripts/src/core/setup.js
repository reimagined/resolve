import assignSettings from './assign_settings'
import getResolveConfigFactory from './get_resolve_config_factory'
import validateConfig from './validate_config'

const setup = async options => {
  const resolveConfigFactory = getResolveConfigFactory()
  const resolveConfig = await resolveConfigFactory()

  validateConfig(resolveConfig)
  assignSettings(resolveConfig, options)

  return resolveConfig
}

export default setup
