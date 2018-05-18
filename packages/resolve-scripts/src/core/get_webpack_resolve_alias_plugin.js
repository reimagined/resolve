import getIn from 'lodash/get'

import paths from '../../configs/resolve.config.paths'

const getWebpackResolveAliasPlugin = ({ resolveConfig }) => {
  const alias = {}

  for (const key of [...paths.files, ...paths.filesOrModules]) {
    alias[`$resolve.${key}`] = getIn(resolveConfig, key)
  }

  return alias
}

export default getWebpackResolveAliasPlugin
