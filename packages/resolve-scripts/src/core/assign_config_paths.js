import getIn from 'lodash/get'
import setIn from 'lodash/set'

import { paths } from './constants'
import resolveFile from './resolve_file'
import resolveFileOrModule from './resolve_file_or_module'

const assignConfigPaths = resolveConfig => {
  for (const key of paths.files) {
    setIn(resolveConfig, key, resolveFile(getIn(resolveConfig, key)))
  }
  for (const key of paths.filesOrModules) {
    setIn(resolveConfig, key, resolveFileOrModule(getIn(resolveConfig, key)))
  }
}

export default assignConfigPaths
