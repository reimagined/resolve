import path from 'path'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'

import getModulesDirs from './get_modules_dirs'
import getWebpackResolveAliasPlugin from './get_webpack_resolve_alias_plugin'

const babelConfig = require('../../configs/babelrc.json')

export default ({ resolveConfig, deployOptions, env }) => {
  const serverIndexPath = path.resolve(__dirname, '../runtime/server/index.js')

  const serverDistDir = path.resolve(
    process.cwd(),
    resolveConfig.distDir,
    'server'
  )

  return {
    name: 'Server',
    entry: ['babel-regenerator-runtime', serverIndexPath],
    mode: deployOptions.mode,
    devtool: 'source-map',
    target: 'node',
    node: {
      __dirname: true,
      __filename: true
    },
    resolve: {
      modules: getModulesDirs()
    },
    output: {
      path: serverDistDir,
      filename: 'server.js',
      devtoolModuleFilenameTemplate: '[resource-path]',
      devtoolFallbackModuleFilenameTemplate: '[resource-path]?[hash]'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loaders: [
            {
              loader: 'babel-loader',
              query: {
                ...babelConfig,
                env: {
                  development: {
                    plugins: ['babel-plugin-object-source']
                  }
                }
              }
            }
          ],
          exclude: getModulesDirs()
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': `"${env.NODE_ENV}"`
      }),
      getWebpackResolveAliasPlugin({ resolveConfig, deployOptions }),
      new webpack.BannerPlugin({
        banner: 'require("source-map-support").install();',
        raw: true,
        entryOnly: false
      })
    ],
    externals: getModulesDirs().map(modulesDir => nodeExternals({ modulesDir }))
  }
}
