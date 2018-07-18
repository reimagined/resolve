import path from 'path'

import getModulesDirs from './get_modules_dirs'
import getWebpackEnvPlugin from './get_webpack_env_plugin'
import resolveFile from './resolve_file'

const getClientWebpackConfig = ({
  resolveConfig,
  deployOptions,
  env,
  alias
}) => {
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
    context: path.resolve(process.cwd()),
    mode: deployOptions.mode,
    performance: false,
    devtool: 'source-map',
    target: 'web',
    output: {
      path: clientDistDir,
      filename: 'client.js',
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
          exclude: [
            /node_modules/,
            ...getModulesDirs(),
            path.resolve(__dirname, '../../dist')
          ]
        }
      ]
    },
    plugins: [
      getWebpackEnvPlugin({ resolveConfig, deployOptions, env, isClient })
    ]
  }
}

export default getClientWebpackConfig
