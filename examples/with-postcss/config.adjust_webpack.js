import ExtractTextPlugin from 'extract-text-webpack-plugin'
import postcssImport from 'postcss-import'
import autoprefixer from 'autoprefixer'

const adjustWebpackConfigs = webpackConfigs => {
  for (const webpackConfig of webpackConfigs) {
    webpackConfig.module.rules.push({
      test: /\.css$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: [postcssImport(), autoprefixer()]
            }
          }
        ]
      })
    })

    const extractTextPlugin = new ExtractTextPlugin({
      filename: 'style.css',
      allChunks: true
    })

    webpackConfig.plugins = Array.isArray(webpackConfig.plugins)
      ? webpackConfig.plugins.concat([extractTextPlugin])
      : [extractTextPlugin]
  }
}

export default adjustWebpackConfigs
