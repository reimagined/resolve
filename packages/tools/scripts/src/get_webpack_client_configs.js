import path from 'path'
import EsmWebpackPlugin from '@purtuga/esm-webpack-plugin'

import attachWebpackConfigsClientEntries from './attach_webpack_configs_client_entries'
import getModulesDirs from './get_modules_dirs'

const getClientWebpackConfigs = ({ resolveConfig, alias }) => {
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
          useESModules: false,
        },
      ],
    ],
  }

  const baseClientConfig = {
    name: 'ClientConfigName',
    entry: {},
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
    },
    resolve: {
      modules: getModulesDirs(),
      alias,
    },
    module: {
      rules: [
        {
          test: Object.values(alias),
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: clientTransformBabelOptions,
            },
            {
              loader: require.resolve('./val_query_loader'),
              options: {
                resolveConfig,
                isClient,
              },
            },
          ],
        },
        {
          test: /\.js$/,
          use: {
            loader: require.resolve('babel-loader'),
            options: {
              cacheDirectory: true,
            },
          },
          exclude: [
            /node_modules/,
            ...getModulesDirs({ isAbsolutePath: true }),
            path.resolve(__dirname, '../lib'),
            path.resolve(__dirname, '../es'),
          ],
        },
        {
          test: /@resolve-js\/runtime[\\/](?!node_modules).*?\.js$/,
          use: {
            loader: require.resolve('babel-loader'),
            options: clientTransformBabelOptions,
          },
        },
      ],
    },
    plugins: [],
  }

  const clientConfigs = [
    {
      ...baseClientConfig,
      name: 'Shared client ESM chunks',
      entry: {
        'common/shared/client-chunk.js': path.resolve(
          __dirname,
          './alias/$resolve.clientChunk.js'
        ),
        'common/shared/client-imports.js': path.resolve(
          __dirname,
          './alias/$resolve.clientImports.js'
        ),
        'common/shared/view-models.js': path.resolve(
          __dirname,
          './alias/$resolve.viewModels.js'
        ),
      },
      output: {
        ...baseClientConfig.output,
        libraryTarget: 'var',
        library: '__RESOLVE_ENTRY__',
      },
      plugins: [...baseClientConfig.plugins, new EsmWebpackPlugin()],
    },
  ]

  attachWebpackConfigsClientEntries(
    resolveConfig,
    baseClientConfig,
    clientConfigs,
    true
  )

  return clientConfigs
}

export default getClientWebpackConfigs
