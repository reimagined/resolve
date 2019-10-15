import path from 'path'
import ReplaceInFileWebpackPlugin from 'replace-in-file-webpack-plugin'

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

  const polyfills = Array.isArray(resolveConfig.polyfills)
    ? resolveConfig.polyfills
    : []

  const clientConfig = {
    name: 'Client',
    entry: {
      'common/client/client-chunk.js': [
        ...polyfills,
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
      libraryTarget: 'commonjs-module'
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
    },
    plugins: [
      new ReplaceInFileWebpackPlugin([
        {
          dir: path.join(distDir, 'common', 'client'),
          files: ['client-chunk.js'],
          rules: [
            {
              search: /^module.exports/,
              replace: 'const mainExport'
            },
            {
              search: /$/,
              replace: '\n\nexport default mainExport'
            }
          ]
        }
      ])
    ]
  }

  // TODO: extract in compile-time abstract module
  if (resolveConfig.redux != null && resolveConfig.routes != null) {
    clientConfig.entry['client/react-entry.js'] = [
      ...polyfills,
      path.resolve(__dirname, './alias/$resolve.reactClientEntry.js')
    ]

    clientConfig.plugins.push(
      new ReplaceInFileWebpackPlugin([
        {
          dir: path.join(distDir, 'client'),
          files: ['react-entry.js'],
          rules: [
            {
              search: /^module.exports/,
              replace: 'var mainReactEntry'
            }
          ]
        }
      ])
    )
  }

  return clientConfig
}

export default getClientWebpackConfig
