import { transformFileSync } from '@babel/core'

import getModulesDirs from './get_modules_dirs'
import resolveFile from './resolve_file'

const getResolveBuildConfig = (argv, env) => {
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

  return resolveBuildConfig
}

export default getResolveBuildConfig
