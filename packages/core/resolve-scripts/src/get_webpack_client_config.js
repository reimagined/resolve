import path from 'path'

import getModulesDirs from './get_modules_dirs'

const getClientWebpackConfig = ({ resolveConfig, alias }) => {
  const clientDistDir = path.resolve(
    process.cwd(),
    resolveConfig.distDir,
    'client'
  )

  const isClient = true
  const polyfills = Array.isArray(resolveConfig.polyfills)
    ? resolveConfig.polyfills
    : []

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
      'bundle.js': [
        ...polyfills,
        path.resolve(__dirname, './alias/$resolve.clientEntry.js')
      ],
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
      devtoolModuleFilenameTemplate: '[namespace][resource-path]',
      devtoolFallbackModuleFilenameTemplate: '[namespace][resource-path]?[hash]'
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
