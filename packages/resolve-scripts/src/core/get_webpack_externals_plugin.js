import getIn from 'lodash/get'

import isResolveConfigEnv from './is_resolve_config_env'

const regExp = /^\$resolve\./

const getWebpackExternalsPlugin = ({
  resolveConfig,
  deployOptions,
  isClient
}) => {
  return (context, request, callback) => {
    const key = request.replace(regExp, '')
    const path = getIn(resolveConfig, key)

    if (isResolveConfigEnv(path)) {
      if (isClient) {
        return callback(
          `Don't use environment variables "${
            deployOptions.env[path]
          }" in the client code`
        )
      } else {
        return callback(null, `require(${deployOptions.env[path]})`)
      }
    }

    callback()
  }
}

export default getWebpackExternalsPlugin
