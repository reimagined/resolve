import path from 'path'

import getModulesDirs from './get_modules_dirs'
import getWebpackEnvPlugin from './get_webpack_env_plugin'
import getWebpackResolveDefinePlugin from './get_webpack_resolve_define_plugin'
import getWebpackResolveAliasPlugin from './get_webpack_resolve_alias_plugin'

const getClientWebpackConfig = ({ resolveConfig, deployOptions, env }) => {
  const clientIndexPath = resolveConfig.index
  const clientDistDir = path.resolve(
    process.cwd(),
    resolveConfig.distDir,
    'client'
  )

  return {
    name: 'Client',
    entry: ['@babel/runtime/regenerator', clientIndexPath],
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
      modules: getModulesDirs(),
      alias: getWebpackResolveAliasPlugin({ resolveConfig, deployOptions, env })
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader?cacheDirectory=true'
          },
          exclude: [
            /node_modules/,
            ...getModulesDirs(),
            path.resolve(__dirname, '../../dist')
          ]
        }
      ]
    },
    plugins: [
      getWebpackEnvPlugin({ resolveConfig, deployOptions, env }),
      getWebpackResolveDefinePlugin({ resolveConfig, deployOptions, env })
    ]
  }
}

export default getClientWebpackConfig
