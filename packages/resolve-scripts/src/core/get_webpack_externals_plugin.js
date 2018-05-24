import getIn from 'lodash/get'

import isResolveConfigEnv from './is_resolve_config_env'
import getVirtualModule from './get_virtual_module'
import resolveRelativePath from './resolve_relative_path'

const regExp = /^\$resolve\./

const getWebpackExternalsPlugin = ({
  resolveConfig,
  deployOptions,
  isClient
}) => {
  return (context, request, callback) => {
    const key = request.replace(regExp, '')
    const value = getIn(resolveConfig, key)

    switch (key) {
      case 'readModels': {
        return callback(
          null,
          getVirtualModule(`[
          ${resolveConfig.readModels
            .map(
              ({ name, projection, resolvers, storage }) => `{
            name: "${name}",
            projection: ${
              !isClient && projection
                ? `require("${resolveRelativePath(projection)}")`
                : '{}'
            },
            resolvers: ${
              !isClient && resolvers
                ? `require("${resolveRelativePath(resolvers)}")`
                : '{}'
            },
            storage: ${
              !isClient && storage
                ? `require("${resolveRelativePath(storage)}")`
                : 'undefined'
            }
          }`
            )
            .join(',')}
        ]`)
        )
      }
      case 'aggregates': {
        return callback(
          null,
          getVirtualModule(`[
          ${resolveConfig.aggregates
            .map(
              ({ name, commands, projection, snapshot }) => `{
            name: "${name}",
            commands: ${
              commands ? `require("${resolveRelativePath(commands)}")` : '{}'
            },
            projection: ${
              !isClient && projection
                ? `require("${resolveRelativePath(projection)}")`
                : '{}'
            },
            snapshot: ${
              !isClient && snapshot
                ? `require("${resolveRelativePath(snapshot)}")`
                : 'undefined'
            }
          }`
            )
            .join(',')}
        ]`)
        )
      }
      default:
    }

    if (isResolveConfigEnv(value)) {
      if (isClient) {
        return callback(
          `Don't use environment variables "${
            deployOptions.env[value]
          }" in the client code`
        )
      } else {
        return callback(null, `require(${deployOptions.env[value]})`)
      }
    }

    callback()
  }
}

export default getWebpackExternalsPlugin
