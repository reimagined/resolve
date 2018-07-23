import importBabel from './import_babel'
import resolveFile from './resolve_file'

const getResolveBuildConfig = (argv, env) => {
  const path = resolveFile(
    argv.buildConfig || env.BUILD_CONFIG_PATH || 'resolve.build.config.js'
  )

  return importBabel(path)
}

export default getResolveBuildConfig
