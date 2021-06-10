import VueLoaderPlugin from 'vue-loader/lib/plugin'
import CopyPlugin from 'copy-webpack-plugin'
import path from 'path'

const adjustWebpackEntry = (webpackConfig) => {
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
  })

  resolve.alias['vue$'] = mode === 'development' ? 'vue/dist/vue' : 'vue'

  resolve.extensions = ['.js', '.vue']

  plugins.push(new VueLoaderPlugin())
}

const adjustWebpackConfigs = (webpackConfigs) => {
  for (const webpackConfig of webpackConfigs) {
    const {
      module: { rules },
      resolve,
    } = webpackConfig

    rules.push({
      test: /\.tsx?$/,
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-typescript'],
        appendTsSuffixTo: [/\.vue$/],
      },
    })
    resolve.extensions = ['.js', '.jsx', '.ts', '.tsx']

    rules.push({
      test: /\.tsx?$/,
      loader: 'ts-loader',
      options: {
        appendTsSuffixTo: [/\.vue$/],
      },
    })
  }

  const clientEntry = webpackConfigs.find(
    ({ entry, target }) =>
      Object.keys(entry).find((entry) => entry.endsWith('client/index.ts')) !=
        null && target === 'web'
  )
  const ssrEntry = webpackConfigs.find(
    ({ entry, target }) =>
      Object.keys(entry).find((entry) => entry.endsWith('/ssr.ts')) != null &&
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
