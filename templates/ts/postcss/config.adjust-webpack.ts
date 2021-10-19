import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import postcssImport from 'postcss-import'
import autoprefixer from 'autoprefixer'

// enable-ts
const enableTypescript = (webpackConfig: any) => {
  webpackConfig.module.rules.push({
    test: /\.tsx?$/,
    loader: 'babel-loader',
    options: {
      presets: [
        [
          '@babel/preset-typescript',
          {
            isTSX: true,
            allExtensions: true,
          },
        ],
      ],
    },
  })
  webpackConfig.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx']
}
// enable-ts

const adjustWebpackConfigs = (webpackConfigs: any[]) => {
  for (const webpackConfig of webpackConfigs) {
    enableTypescript(webpackConfig)

    const entries = Object.keys(webpackConfig.entry)
    const target = webpackConfig.target
    const isUIConfig =
      (entries.find((entry) => entry.endsWith('ssr.js')) != null &&
        target === 'node') ||
      (entries.find((entry) => entry.endsWith('client/index.js')) != null &&
        target === 'web')

    if (!isUIConfig) {
      continue
    }

    webpackConfig.module.rules.push({
      test: /\.css$/,
      use: [
        {
          loader: MiniCssExtractPlugin.loader,
          options: {
            publicPath: '/static/',
          },
        },
        {
          loader: 'css-loader',
          options: {
            modules: true,
            importLoaders: 1,
          },
        },
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: [postcssImport(), autoprefixer()],
            },
          },
        },
      ],
    })

    const extractTextPlugin = new MiniCssExtractPlugin({
      filename: 'client/style.css',
    })

    webpackConfig.plugins = Array.isArray(webpackConfig.plugins)
      ? webpackConfig.plugins.concat([extractTextPlugin])
      : [extractTextPlugin]
  }
}

export default adjustWebpackConfigs
