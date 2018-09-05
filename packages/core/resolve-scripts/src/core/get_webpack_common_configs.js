import path from 'path'
import nodeExternals from 'webpack-node-externals'

import getModulesDirs from './get_modules_dirs'
import getWebpackEnvPlugin from './get_webpack_env_plugin'

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
          ...polyfills,
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
            test: /core(\/|\\)alias(\/|\\)\$resolve.\w+\.js/,
            use: [
              {
                loader: 'babel-loader',
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
