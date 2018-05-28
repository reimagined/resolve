import path from 'path'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'

import getModulesDirs from './get_modules_dirs'
import getWebpackEnvPlugin from './get_webpack_env_plugin'
import getWebpackResolveDefinePlugin from './get_webpack_resolve_define_plugin'
import getWebpackResolveAliasPlugin from './get_webpack_resolve_alias_plugin'
import getWebpackExternalsPlugin from './get_webpack_externals_plugin'

const getWebpackServerConfig = ({ resolveConfig, deployOptions, env }) => {
  const serverIndexPath = path.resolve(__dirname, '../runtime/server/index.js')

  const serverDistDir = path.resolve(
    process.cwd(),
    resolveConfig.distDir,
    'server'
  )

  const isClient = false

  return {
    name: 'Server',
    entry: ['@babel/runtime/regenerator', serverIndexPath],
    context: path.resolve(process.cwd()),
    mode: deployOptions.mode,
    performance: false,
    devtool: 'source-map',
    target: 'node',
    node: {
      __dirname: true,
      __filename: true
    },
    resolve: {
      modules: getModulesDirs()
      // alias: getWebpackResolveAliasPlugin({
      //   resolveConfig,
      //   deployOptions,
      //   env,
      //   isClient
      // })
    },
    output: {
      path: serverDistDir,
      filename: 'server.js',
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
    },
    module: {
      rules: [
        {
          test: /\$resolve.\w+\.js/,
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
              cacheDirectory: true,
              env: {
                development: {
                  plugins: ['babel-plugin-object-source']
                }
              }
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
      // getWebpackResolveDefinePlugin({
      //   resolveConfig,
      //   deployOptions,
      //   env,
      //   isClient
      // }),
      new webpack.BannerPlugin({
        banner: 'require("source-map-support").install();',
        raw: true,
        entryOnly: false
      })
    ],
    externals: [
      /node_modules/,
      nodeExternals(),
      ...getModulesDirs().map(modulesDir => nodeExternals({ modulesDir }))
      //getWebpackExternalsPlugin({ resolveConfig, deployOptions, env, isClient })
    ]
  }
}

export default getWebpackServerConfig
