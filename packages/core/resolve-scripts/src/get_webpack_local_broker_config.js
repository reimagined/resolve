import path from 'path'
import nodeExternals from 'webpack-node-externals'

import getModulesDirs from './get_modules_dirs'
import getWebpackAlias from './get_webpack_alias'

const getWebpackLocalBrokerConfig = resolveConfig => {
  const alias = getWebpackAlias()

  const distDir = path.resolve(process.cwd(), resolveConfig.distDir)

  if (resolveConfig.target !== 'local') {
    throw new Error('Bus broker is available only for local launch')
  }

  return {
    name: 'Bus broker local entry point',
    entry: {
      'common/local-entry/local-bus-broker.js': path.resolve(
        __dirname,
        './alias/$resolve.localBusBroker.js'
      )
    },
    context: path.resolve(process.cwd()),
    mode: resolveConfig.mode,
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
      libraryTarget: 'commonjs-module',
      devtoolModuleFilenameTemplate: '[namespace][resource-path]',
      devtoolFallbackModuleFilenameTemplate: '[namespace][resource-path]?[hash]'
    },
    module: {
      rules: [
        {
          test: Object.values(alias),
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: {
                cacheDirectory: true,
                babelrc: false,
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      targets: { node: '8.10.0' }
                    }
                  ],
                  '@babel/preset-react'
                ],
                plugins: [
                  '@babel/plugin-proposal-class-properties',
                  '@babel/plugin-proposal-export-default-from',
                  '@babel/plugin-proposal-export-namespace-from',
                  [
                    '@babel/plugin-transform-runtime',
                    {
                      corejs: false,
                      helpers: false,
                      regenerator: false,
                      useESModules: false
                    }
                  ]
                ]
              }
            },
            {
              loader: require.resolve('val-loader'),
              options: {
                resolveConfig,
                isClient: false
              }
            }
          ]
        },
        {
          test: /\.js$/,
          use: {
            loader: require.resolve('babel-loader'),
            options: {
              cacheDirectory: true
            }
          },
          exclude: [
            /node_modules/,
            ...getModulesDirs({ isAbsolutePath: true }),
            path.resolve(__dirname, '../lib'),
            path.resolve(__dirname, '../es')
          ]
        }
      ]
    },
    externals: [
      ...getModulesDirs().map(modulesDir => nodeExternals({ modulesDir }))
    ]
  }
}

export default getWebpackLocalBrokerConfig
