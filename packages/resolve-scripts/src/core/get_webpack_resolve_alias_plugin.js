import path from 'path'
import getIn from 'lodash/get'

const getWebpackResolveAliasPlugin = ({ resolveConfig, deployOptions }) => {
  const alias = {}

  for (const key of [
    ...resolveConfig.meta.file,
    ...resolveConfig.meta.fileOrModule
  ]) {
    // TODO
    if (resolveConfig.meta.external.find(baseKey => key.startsWith(baseKey))) {
      continue
    }
    let value = getIn(resolveConfig, key)
    if (value in deployOptions.env) {
      value = deployOptions.env[value]
    }
    alias[`$resolve.${key}`] = value
  }

  alias['$resolve.viewModels'] = path.resolve(
    __dirname,
    './alias/$resolve.viewModels.js'
  )

  alias['$resolve.aggregates'] = path.resolve(
    __dirname,
    './alias/$resolve.aggregates.js'
  )

  return alias
}

export default getWebpackResolveAliasPlugin
