import path from 'path'
import nodeExternals from 'webpack-node-externals'

import getModulesDirs from './get_modules_dirs'
import getWebpackEnvPlugin from './get_webpack_env_plugin'
import resolveFile from './resolve_file'

const getWebpackCommonConfigs = ({
  resolveConfig,
  alias,
  nodeModulesByAssembly
}) => {
  const distDir = path.resolve(process.cwd(), resolveConfig.distDir)

  const isClient = false

  const polyfills = Array.isArray(resolveConfig.polyfills)
    ? resolveConfig.polyfills
    : []

  const assemblies = [
    {
      name: 'Aggregates',
      entry: {
        'common/aggregates/index.js': [
          ...polyfills,
          path.resolve(__dirname, './alias/$resolve.aggregates.js')
        ]
      },
      packageJson: 'common/aggregates/package.json'
    },
    {
      name: 'View Models',
      entry: {
        'common/view-models/index.js': [
          ...polyfills,
          path.resolve(__dirname, './alias/$resolve.viewModels.js')
        ]
      },
      packageJson: 'common/view-models/package.json'
    },
    {
      name: 'Read Models',
      entry: {
        'common/read-models/index.js': [
          ...polyfills,
          path.resolve(__dirname, './alias/$resolve.readModels.js')
        ]
      },
      packageJson: 'common/read-models/package.json'
    },
    {
      name: 'Sagas',
      entry: {
        'common/sagas/index.js': [
          ...polyfills,
          path.resolve(__dirname, './alias/$resolve.sagas.js')
        ]
      },
      packageJson: 'common/sagas/package.json'
    },
    {
      name: 'Api Handlers',
      entry: {
        'common/api-handlers/index.js': [
          ...polyfills,
          path.resolve(__dirname, './alias/$resolve.apiHandlers.js')
        ]
      },
      packageJson: 'common/api-handlers/package.json'
    },
    {
      name: 'Auth',
      entry: {
        'common/auth/index.js': [
          ...polyfills,
          path.resolve(__dirname, './alias/$resolve.auth.js')
        ]
      },
      packageJson: 'common/auth/package.json'
    },
    {
      name: 'Constants',
      entry: {
        'common/constants/index.js': [
          path.resolve(__dirname, './alias/$resolve.constants.js')
        ]
      }
    },
    {
      name: 'Assemblies',
      entry: {
        'assemblies.js': [
          ...polyfills,
          path.resolve(__dirname, './alias/$resolve.assemblies.js')
        ]
      }
    }
  ]

  const apiHandlers = Array.isArray(resolveConfig.apiHandlers)
    ? resolveConfig.apiHandlers
    : []

  for (const { path, controller } of apiHandlers) {
    const syntheticName = path.replace(/[^\w\d-]/g, '-')
    assemblies.push({
      name: `Api Handler "${syntheticName}" for path "${path}"`,
      entry: {
        [`common/api-handlers/${syntheticName}/index.js`]: [
          ...polyfills,
          resolveFile(controller)
        ]
      },
      packageJson: `common/api-handlers/${syntheticName}/package.json`
    })
  }

  const configs = []

  for (const assembly of assemblies) {
    if (assembly.hasOwnProperty('packageJson')) {
      nodeModulesByAssembly.set(assembly.packageJson, new Set())
    }

    configs.push({
      name: assembly.name,
      entry: assembly.entry,
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
        devtoolModuleFilenameTemplate: '[absolute-resource-path]',
        devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
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
                        targets: {
                          node: '8.10.0'
                        }
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
              path.resolve(__dirname, '../../lib'),
              path.resolve(__dirname, '../../es')
            ]
          }
        ]
      },
      plugins: [getWebpackEnvPlugin({ resolveConfig, isClient })],
      externals: [
        (context, request, callback) => {
          if (assembly.hasOwnProperty('packageJson')) {
            if (request[0] !== '/' && request[0] !== '.') {
              const packageName = request
                .split('/')
                .slice(0, request[0] === '@' ? 2 : 1)
                .join('/')
              nodeModulesByAssembly.get(assembly.packageJson).add(packageName)
            }
          }
          callback()
        },
        ...getModulesDirs().map(modulesDir => nodeExternals({ modulesDir }))
      ]
    })
  }

  return configs
}

export default getWebpackCommonConfigs
