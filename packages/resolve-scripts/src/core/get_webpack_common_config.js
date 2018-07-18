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
  const distDir = path.resolve(
    process.cwd(),
    resolveConfig.distDir,
  )

  const isClient = false

  const libs = [
    '@babel/runtime/regenerator',
    'source-map-support'
  ]

  return {
    name: 'Common',
    entry: {
      "common/aggregates/index.js": [...libs, path.resolve(__dirname, '../runtime/common/aggregates/index.js')],
      "common/view-models/index.js": [...libs, path.resolve(__dirname, '../runtime/common/view-models/index.js')],
      "common/read-models/index.js": [...libs, path.resolve(__dirname, '../runtime/common/read-models/index.js')],
      "common/sagas/index.js": [...libs, path.resolve(__dirname, '../runtime/common/sagas/index.js')],
      "auth/index.js": [...libs, path.resolve(__dirname, '../runtime/auth/index.js')]
    },
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
      path: distDir,
      filename: '[name]',
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
                  ['@babel/preset-env', {
                    "targets": {
                      "node": "8.10.0"
                    }
                  }],
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
