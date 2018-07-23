import path from 'path'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'

import getModulesDirs from './get_modules_dirs'
import getWebpackEnvPlugin from './get_webpack_env_plugin'

const getWebpackServerConfig = ({
  resolveConfig,
  deployOptions,
  env,
  alias
}) => {
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
      modules: getModulesDirs(),
      alias
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
          test: /core(\/|\\)alias(\/|\\)\$resolve.\w+\.js/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
                babelrc: false,
                presets: [
                  '@babel/preset-env',
                  [
                    '@babel/preset-stage-0',
                    {
                      decoratorsLegacy: true,
                      pipelineProposal: 'minimal'
                    }
                  ],
                  '@babel/preset-react'
                ],
                plugins: ['@babel/plugin-transform-runtime']
              }
            },
            {
              loader: 'val-loader',
              options: {
                resolveConfig,
                deployOptions,
                isClient
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
      new webpack.BannerPlugin({
        banner: 'require("source-map-support").install();',
        raw: true,
        entryOnly: false
      })
    ],
    externals: getModulesDirs().map(modulesDir => nodeExternals({ modulesDir }))
  }
}

export default getWebpackServerConfig
