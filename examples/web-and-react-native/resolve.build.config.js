import fs from 'fs'
import path from 'path'
import webpack from 'webpack'

import nodeExternals from 'webpack-node-externals'
import getModulesDirs from 'resolve-scripts/dist/core/get_modules_dirs'
import getWebpackEnvPlugin from 'resolve-scripts/dist/core/get_webpack_env_plugin'
import getWebpackAlias from 'resolve-scripts/dist/core/get_webpack_alias'

export default (webpackConfigs, { resolveConfig, deployOptions, env }) => {
  const alias = {
    ...getWebpackAlias(),
    ['$resolve.businessLogic']: path.resolve(
      __dirname,
      'core/alias/$resolve.businessLogic.js'
    )
  }

  const isClient = true

  webpackConfigs.push({
    name: 'Common Business Logic',
    entry: {
      'client/native/resolve/index.js': [
        '@babel/runtime/regenerator',
        '$resolve.businessLogic'
      ]
    },
    context: path.resolve(process.cwd()),
    mode: deployOptions.mode,
    performance: false,
    devtool: 'source-map',
    target: 'node',
    output: {
      path: process.cwd(),
      filename: '[name]',
      libraryTarget: 'commonjs-module',
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
    },
    resolve: {
      modules: getModulesDirs(),
      alias
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
              cacheDirectory: true
            }
          },
          exclude: [/node_modules/, ...getModulesDirs()]
        }
      ]
    },
    plugins: [
      getWebpackEnvPlugin({ resolveConfig, deployOptions, env, isClient })
    ]
  })
}
