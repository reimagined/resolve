import path from 'path'
import webpack from 'webpack'

import getModulesDirs from './get_modules_dirs'
import getWebpackResolveAliasPlugin from './get_webpack_resolve_alias_plugin'

const babelConfig = require('../../configs/babelrc.json')

export default ({ resolveConfig, deployOptions, env }) => {
  const clientIndexPath = resolveConfig.index
  const clientDistDir = path.resolve(
    process.cwd(),
    resolveConfig.distDir,
    'client'
  )

  return {
    name: 'Client',
    entry: ['babel-regenerator-runtime', clientIndexPath],
    mode: deployOptions.mode,
    devtool: 'source-map',
    target: 'web',
    output: {
      path: clientDistDir,
      filename: 'client.js',
      devtoolModuleFilenameTemplate: '[resource-path]',
      devtoolFallbackModuleFilenameTemplate: '[resource-path]?[hash]'
    },
    resolve: {
      modules: getModulesDirs()
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loaders: [
            {
              loader: 'babel-loader',
              query: babelConfig
            }
          ],
          exclude: getModulesDirs()
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': `"${env.NODE_ENV}"`,
        'process.env': 'window.__PROCESS_ENV__'
      }),
      getWebpackResolveAliasPlugin({ resolveConfig, deployOptions })
    ]
  }
}
