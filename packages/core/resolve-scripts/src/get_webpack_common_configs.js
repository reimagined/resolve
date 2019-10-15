import path from 'path'
import nodeExternals from 'webpack-node-externals'

import getModulesDirs from './get_modules_dirs'

const getWebpackCommonConfigs = ({
  resolveConfig,
  alias,
  nodeModulesByAssembly
}) => {
  // TODO: extract in compile-time abstract module
  if (resolveConfig.redux != null && resolveConfig.routes != null) {
    resolveConfig.apiHandlers.push({
      controller: path.resolve(__dirname, './alias/$resolve.reactSsrEntry.js'),
      path: '/:markup*',
      method: 'GET'
    })
  }

  const distDir = path.resolve(process.cwd(), resolveConfig.distDir)
  const isClient = false

  const polyfills = Array.isArray(resolveConfig.polyfills)
    ? resolveConfig.polyfills
    : []

  const assemblies = []
  if (resolveConfig.target === 'local') {
    assemblies.push({
      name: 'Server local entry point',
      entry: {
        'common/local-entry/local-entry.js': [
          ...polyfills,
          path.resolve(__dirname, './alias/$resolve.localEntry.js')
        ]
      },
      packageJson: 'common/local-entry/package.json'
    })

    assemblies.push({
      name: 'Local event broker entry point',
      entry: {
        'common/local-entry/local-bus-broker.js': [
          path.resolve(__dirname, './alias/$resolve.localBusBroker.js')
        ]
      }
    })
  } else if (resolveConfig.target === 'cloud') {
    assemblies.push({
      name: 'Server cloud entry point',
      entry: {
        'common/cloud-entry/cloud-entry.js': [
          ...polyfills,
          path.resolve(__dirname, './alias/$resolve.cloudEntry.js')
        ]
      },
      packageJson: 'common/cloud-entry/package.json'
    })
  } else {
    throw new Error(`Wrong target mode ${resolveConfig.target}`)
  }

  const configs = []

  for (const assembly of assemblies) {
    if (
      assembly.hasOwnProperty('packageJson') &&
      !nodeModulesByAssembly.has(assembly.packageJson)
    ) {
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
        devtoolModuleFilenameTemplate: '[namespace][resource-path]',
        devtoolFallbackModuleFilenameTemplate:
          '[namespace][resource-path]?[hash]'
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
        ...getModulesDirs().map(modulesDir =>
          nodeExternals({ modulesDir, whitelist: [/resolve-runtime/] })
        )
      ]
    })
  }

  return configs
}

export default getWebpackCommonConfigs
