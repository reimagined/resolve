import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import postcssImport from 'postcss-import'
import autoprefixer from 'autoprefixer'

const adjustWebpackConfigs = (webpackConfigs) => {
  for (const webpackConfig of webpackConfigs) {
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
