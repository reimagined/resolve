import importBabel from './import_babel'
import resolveFile from './resolve_file'

const getResolveBuildConfig = () => {
  const path = resolveFile('resolve.config.js')

  return importBabel(path)
}

export default getResolveBuildConfig
