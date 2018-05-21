import getIn from 'lodash/get'

import paths from '../../configs/resolve.config.paths'

const getWebpackResolveAliasPlugin = ({ resolveConfig, deployOptions }) => {
  const alias = {}

  for (const key of [...paths.files, ...paths.filesOrModules]) {
    let value = getIn(resolveConfig, key)
    if (value in deployOptions.env) {
      value = deployOptions.env[value]
    }
    alias[`$resolve.${key}`] = value
  }

  return alias
}

export default getWebpackResolveAliasPlugin
