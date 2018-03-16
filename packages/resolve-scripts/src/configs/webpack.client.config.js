import webpack from 'webpack'

import babelConfig from './babelrc'
import modulesDirs from './modules_dirs'

export default {
  name: 'Client',
  devtool: 'source-map',
  target: 'web',
  output: {
    filename: 'client.js',
    devtoolModuleFilenameTemplate: '[resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[resource-path]?[hash]'
  },
  resolve: {
    modules: modulesDirs
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loaders: [
          {
            loader: 'babel-loader',
            query: babelConfig
          }
        ],
        exclude: modulesDirs
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
      'process.env': 'window.__PROCESS_ENV__'
    })
  ]
}
