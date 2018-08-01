import path from 'path'
import getModulesDirs from 'resolve-scripts/dist/core/get_modules_dirs'
import getWebpackEnvPlugin from 'resolve-scripts/dist/core/get_webpack_env_plugin'

export default (
  webpackConfigs,
  { resolveConfig, deployOptions, env, alias: _alias }
) => {
  const alias = {
    ..._alias,
    '$resolve.businessLogic': path.resolve(
      __dirname,
      'core/alias/$resolve.businessLogic.js'
    ),
    '$resolve.resolveRedux': path.resolve(
      __dirname,
      'core/alias/$resolve.resolveRedux.js'
    )
  }

  const isClient = true

  webpackConfigs.push({
    name: 'Common Business Logic',
    entry: {
      'resolve/config.js': ['$resolve.businessLogic'],
      'resolve/resolve-redux.js': ['$resolve.resolveRedux']
    },
    context: path.resolve(process.cwd()),
    mode: deployOptions.mode,
    performance: false,
    devtool: 'source-map',
    target: 'web',
    output: {
      path: path.resolve(process.cwd(), '../native'),
      filename: '[name]',
      libraryTarget: 'commonjs-module',
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
                cacheDirectory: true
              }
            },
            {
              loader: 'val-loader',
              options: {
                resolveConfig,
                deployOptions,
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
          }
        }
      ]
    },
    plugins: [
      getWebpackEnvPlugin({ resolveConfig, deployOptions, env, isClient })
    ]
  })
}
