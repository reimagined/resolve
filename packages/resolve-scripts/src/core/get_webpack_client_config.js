import path from 'path'

import getModulesDirs from './get_modules_dirs'
import getWebpackEnvPlugin from './get_webpack_env_plugin'
import getWebpackResolveDefinePlugin from './get_webpack_resolve_define_plugin'
import getWebpackResolveAliasPlugin from './get_webpack_resolve_alias_plugin'
import getWebpackExternalsPlugin from './get_webpack_externals_plugin'
import getExternals from './get_externals'

const getClientWebpackConfig = ({ resolveConfig, deployOptions, env }) => {
  //const clientIndexPath = resolveFile(resolveConfig.index)
  const clientDistDir = path.resolve(
    process.cwd(),
    resolveConfig.distDir,
    'client'
  )
  const isClient = true

  return {
    name: 'Client',
    entry: [
      '@babel/runtime/regenerator',
      resolveConfig.index,
      ...getExternals(resolveConfig)
    ],
    context: path.resolve(process.cwd()),
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
          test: path.resolve(__dirname, './alias/$resolve.viewModels.js'),
          use: [
            {
              loader: 'val-loader',
              options: {
                resolveConfig,
                isClient
              }
            },
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true
              }
            }
          ]
        },
        {
          test: path.resolve(__dirname, './alias/$resolve.aggregates.js'),
          use: [
            {
              loader: 'val-loader',
              options: {
                resolveConfig,
                isClient
              }
            },
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true
              }
            }
          ]
        },
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
