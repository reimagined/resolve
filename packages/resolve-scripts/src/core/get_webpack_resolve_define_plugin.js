import webpack from 'webpack'
import flat from 'flat'

const getWebpackResolveDefinePlugin = ({
  resolveConfig,
  deployOptions,
  isClient
}) => {
  const defineObject = {}

  for (const key of Object.keys(deployOptions)) {
    defineObject[`$resolve.${key}`] = JSON.stringify(deployOptions[key])
  }

  for (let maxDepth = 1; maxDepth < 5; maxDepth++) {
    const flatConfig = flat(resolveConfig, { maxDepth })
    for (const key of Object.keys(flatConfig)) {
      let value = flatConfig[key]
      if (value in deployOptions.env) {
        if (isClient) {
          defineObject[`$resolve.${key}`] =
            '@DO_NOT_USE_ENVIRONMENT_VARIABLES_IN_CLIENT_CODE@'
        } else {
          defineObject[`$resolve.${key}`] = deployOptions.env[value]
        }
      } else {
        defineObject[`$resolve.${key}`] = JSON.stringify(flatConfig[key])
      }
    }
  }

  return new webpack.DefinePlugin(defineObject)
}

export default getWebpackResolveDefinePlugin
