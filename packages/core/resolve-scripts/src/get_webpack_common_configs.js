import path from 'path'
import EsmWebpackPlugin from '@purtuga/esm-webpack-plugin'
import nodeExternals from 'webpack-node-externals'

import attachWebpackConfigsClientEntries from './attach_webpack_configs_client_entries'
import getModulesDirs from './get_modules_dirs'

const getWebpackCommonConfigs = ({
  resolveConfig,
  alias,
  nodeModulesByAssembly
}) => {
  const targetMode = resolveConfig.target
  if (!['local', 'cloud'].includes(targetMode)) {
    throw new Error(`Wrong target mode ${targetMode}`)
  }
  const distDir = path.resolve(process.cwd(), resolveConfig.distDir)
  const isClient = false

  const baseCommonConfig = {
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
              loader: require.resolve('./val_query_loader'),
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
        }
      ]
    },
    externals: [
      ...getModulesDirs().map(modulesDir =>
        nodeExternals({ modulesDir, whitelist: [/resolve-runtime/] })
      )
    ],
    plugins: []
  }

  const packageJson = `common/${targetMode}-entry/package.json`
  if (!nodeModulesByAssembly.has(packageJson)) {
    nodeModulesByAssembly.set(packageJson, new Set())
  }

  const packageJsonWriter = (context, request, callback) => {
    if (request[0] !== '/' && request[0] !== '.') {
      const packageName = request
        .split('/')
        .slice(0, request[0] === '@' ? 2 : 1)
        .join('/')

      nodeModulesByAssembly.get(packageJson).add(packageName)
    }
    callback()
  }

  const commonConfigs = [
    {
      ...baseCommonConfig,
      name: `Server ${targetMode} entry point${
        targetMode === 'local' ? ', local bus broker' : ''
      }`,
      entry: {
        [`common/${targetMode}-entry/${targetMode}-entry.js`]: path.resolve(
          __dirname,
          `./alias/$resolve.${targetMode}Entry.js`
        ),
        ...(targetMode === 'local'
          ? {
              'common/local-entry/local-bus-broker.js': path.resolve(
                __dirname,
                './alias/$resolve.localBusBroker.js'
              )
            }
          : {})
      },
      externals: [packageJsonWriter, ...baseCommonConfig.externals]
    },
    {
      ...baseCommonConfig,
      name: `Shared server ESM chunks`,
      entry: {
        'common/shared/server-imports.js': path.resolve(
          __dirname,
          './alias/$resolve.serverImports.js'
        ),
        'common/shared/server-constants.js': path.resolve(
          __dirname,
          './alias/$resolve.constants.js'
        ),
        'common/shared/server-seed-client-envs.js': path.resolve(
          __dirname,
          './alias/$resolve.seedClientEnvs.js'
        )
      },
      output: {
        ...baseCommonConfig.output,
        libraryTarget: 'var',
        library: '__RESOLVE_ENTRY__'
      },
      plugins: [...baseCommonConfig.plugins, new EsmWebpackPlugin()]
    }
  ]

  if (
    targetMode === 'local' &&
    resolveConfig.hasOwnProperty('uploadAdapter') &&
    resolveConfig.uploadAdapter.hasOwnProperty('options') &&
    resolveConfig.uploadAdapter.options.hasOwnProperty('launchServer') &&
    resolveConfig.uploadAdapter.options.launchServer
  ) {
    commonConfigs.push({
      ...baseCommonConfig,
      name: `Server S3`,
      entry: {
        'common/local-entry/local-s3-server.js': path.resolve(
          __dirname,
          './alias/$resolve.localS3Server.js'
        )
      }
    })
  }

  attachWebpackConfigsClientEntries(
    resolveConfig,
    baseCommonConfig,
    commonConfigs,
    false
  )

  return commonConfigs
}

export default getWebpackCommonConfigs
