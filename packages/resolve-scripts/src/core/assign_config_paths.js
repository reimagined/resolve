import getIn from 'lodash/get'
import setIn from 'lodash/set'

import resolveFile from './resolve_file'
import resolveFileOrModule from './resolve_file_or_module'
import isResolveConfigEnv from './is_resolve_config_env'

const assignConfigPaths = resolveConfig => {
  for (const key of resolveConfig.meta.file) {
    const path = getIn(resolveConfig, key)
    if (isResolveConfigEnv(path)) {
      continue
    }
    setIn(resolveConfig, key, resolveFile(path))
  }
  for (const key of resolveConfig.meta.fileOrModule) {
    const path = getIn(resolveConfig, key)
    if (isResolveConfigEnv(path)) {
      continue
    }
    setIn(resolveConfig, key, resolveFileOrModule(path))
  }
}

export default assignConfigPaths
