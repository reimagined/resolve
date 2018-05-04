import fs from 'fs'
import path from 'path'
import JSON5 from 'json5'
import { transformFileSync } from 'babel-core'

import assignSettings from './assign_settings'
import resolveFile from './resolve_file'
import validateConfig from './validate_config'
import getModulesDirs from './get_modules_dirs'

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

  const resolveBuildConfigPath = resolveFile(
    argv.buildConfig || env.BUILD_CONFIG_PATH || 'resolve.build.config.js'
  )

  const resolveBuildConfigCode = transformFileSync(resolveBuildConfigPath).code

  let resolveBuildConfigModule = new module.constructor()

  resolveBuildConfigModule.paths = getModulesDirs()

  resolveBuildConfigModule._compile(
    resolveBuildConfigCode,
    resolveBuildConfigPath
  )

  const resolveBuildConfig =
    resolveBuildConfigModule.exports.default || resolveBuildConfigModule.exports

  assignSettings(
    { resolveConfig, deployOptions, resolveBuildConfig },
    argv,
    env
  )

  validateConfig(resolveConfig)

  return { resolveConfig, deployOptions, resolveBuildConfig }
}
