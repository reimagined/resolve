import path from 'path'

import getModulesDirs from './get_modules_dirs'

const getClientWebpackConfig = ({ resolveConfig, alias }) => {
  const distDir = path.resolve(process.cwd(), resolveConfig.distDir)
  const isClient = true

  const clientTransformBabelOptions = {
    cacheDirectory: true,
    babelrc: false,
    presets: ['@babel/preset-env', '@babel/preset-react'],
    plugins: [
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-export-namespace-from',
      [
        '@babel/plugin-transform-runtime',
        {
          corejs: false,
          helpers: true,
          regenerator: true,
          useESModules: false
        }
      ]
    ]
  }

  return {
    name: 'Client',
    entry: {
      'common/client/client-chunk.js': [
        path.resolve(__dirname, './alias/$resolve.clientChunk.js')
      ]
    },
    context: path.resolve(process.cwd()),
    mode: resolveConfig.mode,
    performance: false,
    devtool: 'source-map',
    target: 'web',
    output: {
      path: distDir,
      filename: '[name]',
      devtoolModuleFilenameTemplate: '[namespace][resource-path]',
      devtoolFallbackModuleFilenameTemplate:
        '[namespace][resource-path]?[hash]',
      library: '_RESOLVE_CLIENT_CHUNK',
      libraryTarget: 'window'
    },
    resolve: {
      modules: getModulesDirs(),
      alias
    },
    module: {
      rules: [
        {
          test: Object.values(alias),
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: clientTransformBabelOptions
            },
            {
              loader: require.resolve('val-loader'),
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
        },
        {
          test: /resolve-runtime[\\/](?!node_modules).*?\.js$/,
          use: {
            loader: require.resolve('babel-loader'),
            options: clientTransformBabelOptions
          }
        }
      ]
    }
  }
}

export default getClientWebpackConfig
