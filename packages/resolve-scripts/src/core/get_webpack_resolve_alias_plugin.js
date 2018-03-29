import webpack from 'webpack'
import flat from 'flat'

const getWebpackResolveAliasPlugin = ({ resolveConfig, deployOptions }) => {
  const defineObject = {}
  for (const key of Object.keys(deployOptions)) {
    defineObject[`$resolve.${key}`] = JSON.stringify(deployOptions[key])
  }
  for (let maxDepth = 1; maxDepth < 5; maxDepth++) {
    const flatConfig = flat(resolveConfig, { maxDepth })
    for (const key of Object.keys(flatConfig)) {
      defineObject[`$resolve.${key}`] = JSON.stringify(flatConfig[key])
    }
  }

  return new webpack.DefinePlugin(defineObject)
}

export default getWebpackResolveAliasPlugin
