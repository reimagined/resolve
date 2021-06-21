import { getModulesDirs } from 'resolve-scripts'
import path from 'path'

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

const baseConfig = {
  context: path.resolve(process.cwd()),
  performance: false,
  devtool: 'source-map',
  output: {
    path: 'distDir',
    filename: '[name]',
    devtoolModuleFilenameTemplate: '[namespace][resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[namespace][resource-path]?[hash]',
  },
  resolve: { modules: getModulesDirs() },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: require.resolve('babel-loader'),
          options: { cacheDirectory: true },
        },
        exclude: [
          /node_modules/,
          ...getModulesDirs({ isAbsolutePath: true }),
          path.resolve(__dirname, '../lib'),
          path.resolve(__dirname, '../es'),
        ],
      },
      {
        test: /resolve-runtime[\\/](?!node_modules).*?\.js$/,
        use: {
          loader: require.resolve('babel-loader'),
          options: clientTransformBabelOptions,
        },
      },
    ],
  },
}

const getWebpackConfigs = ({ mode, distDir }) => [
  {
    ...baseConfig,
    name: 'Index',
    entry: {
      'client/index.js': path.resolve(__dirname, './client/index.js'),
    },
    mode,
    target: 'web',
    output: {
      ...baseConfig.output,
      path: path.join(__dirname, distDir),
    },
  },
]

export default getWebpackConfigs
