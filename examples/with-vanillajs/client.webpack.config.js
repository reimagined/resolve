import { getModulesDirs } from 'resolve-scripts'
import path from 'path'

const getClientWebpackConfig = ({ mode, distDir }) => ({
  name: 'Index',
  entry: {
    'client/index.js': path.resolve(__dirname, './client/index.js')
  },
  mode,
  performance: false,
  devtool: 'source-map',
  target: 'web',
  context: path.resolve(process.cwd()),
  output: {
    path: path.join(__dirname, distDir),
    filename: '[name]',
    devtoolModuleFilenameTemplate: '[namespace][resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[namespace][resource-path]?[hash]'
  },
  resolve: {
    modules: getModulesDirs()
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: require.resolve('babel-loader'),
          options: { cacheDirectory: true }
        },
        exclude: [
          /node_modules/,
          ...getModulesDirs({ isAbsolutePath: true }),
          path.resolve(__dirname, '../lib'),
          path.resolve(__dirname, '../es')
        ]
      }
    ]
  }
})

export default getClientWebpackConfig
