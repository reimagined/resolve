import path from 'path'

import getModulesDirs from './get_modules_dirs'
import getWebpackEnvPlugin from './get_webpack_env_plugin'
import resolveFile from './resolve_file'

const getClientWebpackConfig = ({ resolveConfig, alias }) => {
  const clientIndexPath = resolveFile(resolveConfig.index, 'client_index.js')

  const clientDistDir = path.resolve(
    process.cwd(),
    resolveConfig.distDir,
    'client'
  )

  const isClient = true
  const polyfills = Array.isArray(resolveConfig.polyfills)
    ? resolveConfig.polyfills
    : []

  return {
    name: 'Client',
    entry: {
      'bundle.js': [...polyfills, clientIndexPath],
      'hmr.js': [
        path.resolve(__dirname, './alias/$resolve.hotModuleReplacement.js')
      ]
    },
    context: path.resolve(process.cwd()),
    mode: resolveConfig.mode,
    performance: false,
    devtool: 'source-map',
    target: 'web',
    output: {
      path: clientDistDir,
      filename: '[name]',
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
                presets: ['@babel/preset-env', '@babel/preset-react'],
                plugins: [
                  ['@babel/plugin-proposal-decorators', { legacy: true }],
                  '@babel/plugin-proposal-class-properties',
                  '@babel/plugin-proposal-do-expressions',
                  '@babel/plugin-proposal-export-default-from',
                  '@babel/plugin-proposal-export-namespace-from',
                  '@babel/plugin-proposal-function-bind',
                  '@babel/plugin-proposal-function-sent',
                  '@babel/plugin-proposal-json-strings',
                  '@babel/plugin-proposal-logical-assignment-operators',
                  '@babel/plugin-proposal-nullish-coalescing-operator',
                  '@babel/plugin-proposal-numeric-separator',
                  '@babel/plugin-proposal-optional-chaining',
                  [
                    '@babel/plugin-proposal-pipeline-operator',
                    { proposal: 'minimal' }
                  ],
                  '@babel/plugin-proposal-throw-expressions',
                  '@babel/plugin-syntax-dynamic-import',
                  '@babel/plugin-syntax-import-meta',
                  '@babel/plugin-transform-runtime'
                ]
              }
            },
            {
              loader: 'val-loader',
              options: {
                resolveConfig,
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
    plugins: [getWebpackEnvPlugin({ resolveConfig, isClient })]
  }
}

export default getClientWebpackConfig
