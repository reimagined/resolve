import path from 'path'

import getModulesDirs from './get_modules_dirs'
import getWebpackEnvPlugin from './get_webpack_env_plugin'
import getWebpackResolveDefinePlugin from './get_webpack_resolve_define_plugin'
import getWebpackResolveAliasPlugin from './get_webpack_resolve_alias_plugin'
import getWebpackExternalsPlugin from './get_webpack_externals_plugin'

import resolveFile from './resolve_file'

const getClientWebpackConfig = ({ resolveConfig, deployOptions, env }) => {
  const clientIndexPath = resolveFile(resolveConfig.index)
  const clientDistDir = path.resolve(
    process.cwd(),
    resolveConfig.distDir,
    'client'
  )
  const isClient = true

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
      alias: getWebpackResolveAliasPlugin({
        resolveConfig,
        deployOptions,
        env,
        isClient
      })
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true
            }
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
      getWebpackEnvPlugin({ resolveConfig, deployOptions, env, isClient }),
      getWebpackResolveDefinePlugin({
        resolveConfig,
        deployOptions,
        env,
        isClient
      })
    ],
    externals: [
      getWebpackExternalsPlugin({ resolveConfig, deployOptions, env, isClient })
    ]
  }
}

export default getClientWebpackConfig
