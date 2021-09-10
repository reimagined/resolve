import VueLoaderPlugin from 'vue-loader/lib/plugin'
import CopyPlugin from 'copy-webpack-plugin'
import path from 'path'

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

const adjustWebpackEntry = (webpackConfig: any) => {
  const {
    module: { rules },
    mode,
    resolve,
    plugins,
  } = webpackConfig
  rules.unshift({
    test: /\.css$/,
    use: ['vue-style-loader', 'css-loader'],
  })

  rules.unshift({
    test: /\.vue$/,
    loader: 'vue-loader',
    options: {
      esModule: true,
    },
  })

  enableTypescript(webpackConfig)

  resolve.alias['vue$'] = mode === 'development' ? 'vue/dist/vue' : 'vue'

  plugins.push(new VueLoaderPlugin())
}

const adjustWebpackConfigs = (webpackConfigs: any[]) => {
  const clientEntry = webpackConfigs.find(
    ({ entry, target }) =>
      Object.keys(entry).find((entry) => entry.endsWith('client/index.js')) !=
        null && target === 'web'
  )
  const ssrEntry = webpackConfigs.find(
    ({ entry, target }) =>
      Object.keys(entry).find((entry) => entry.endsWith('/ssr.js')) != null &&
      target === 'node'
  )

  adjustWebpackEntry(clientEntry)
  adjustWebpackEntry(ssrEntry)

  const clientDistDir = path.join(clientEntry.output.path, 'client')
  clientEntry.plugins.push(
    new CopyPlugin({
      patterns: [
        {
          from: require.resolve('bootstrap-vue/dist/bootstrap-vue.css'),
          to: path.join(clientDistDir, 'bootstrap-vue.css'),
        },
        {
          from: require.resolve('bootstrap/dist/css/bootstrap.css'),
          to: path.join(clientDistDir, 'bootstrap.css'),
        },
      ],
    })
  )
}

export default adjustWebpackConfigs
