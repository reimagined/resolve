import path from 'path'

import getModulesDirs from './get_modules_dirs'
import getWebpackEnvPlugin from './get_webpack_env_plugin'
import getWebpackResolveAliasPlugin from './get_webpack_resolve_alias_plugin'

export default ({ resolveConfig, deployOptions, env }) => {
  const clientIndexPath = resolveConfig.index
  const clientDistDir = path.resolve(
    process.cwd(),
    resolveConfig.distDir,
    'client'
  )

  return {
    name: 'Client',
    entry: ['babel-regenerator-runtime', clientIndexPath],
    mode: deployOptions.mode,
    devtool: 'source-map',
    target: 'web',
    output: {
      path: clientDistDir,
      filename: 'client.js',
      devtoolModuleFilenameTemplate: '[resource-path]',
      devtoolFallbackModuleFilenameTemplate: '[resource-path]?[hash]'
    },
    resolve: {
      modules: getModulesDirs()
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loaders: [
            {
              loader: 'babel-loader?cacheDirectory=true'
            }
          ],
          exclude: [...getModulesDirs(), path.resolve(__dirname, '../../dist')]
        }
      ]
    },
    plugins: [
      getWebpackEnvPlugin({ resolveConfig, deployOptions, env }),
      getWebpackResolveAliasPlugin({ resolveConfig, deployOptions })
    ]
  }
}
