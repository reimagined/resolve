import ExtractTextPlugin from 'extract-text-webpack-plugin'
import postcssImport from 'postcss-import'
import autoprefixer from 'autoprefixer'

export default ([webpackClientConfig, webpackServerConfig]) => {
  for (const webpackConfig of [webpackClientConfig, webpackServerConfig]) {
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

    webpackConfig.plugins.push(
      new ExtractTextPlugin({
        filename: 'style.css',
        allChunks: true
      })
    )
  }
}
