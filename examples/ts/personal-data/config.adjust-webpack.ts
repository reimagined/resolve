import webpack from 'webpack'

// eslint-disable-next-line no-unused-vars
const adjustWebpackConfigs = (webpackConfigs: any[]): void => {
  // enable-ts
  for (const webpackConfig of webpackConfigs) {
    const {
      module: { rules },
      resolve,
      plugins,
    } = webpackConfig

    rules.push({
      test: /\.tsx?$/,
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-typescript'],
      },
    })
    resolve.extensions = ['.js', '.jsx', '.ts', '.tsx']

    if (webpackConfig.target === 'web') {
      resolve.fallback = {
        ...resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        process: require.resolve('process/browser'),
      }
      plugins.push(
        new webpack.ProvidePlugin({
          // crypto: 'crypto-browserify',
          // stream: 'stream-browserify',
          process: 'process/browser',
        })
      )
    }
  }
  // enable-ts
}
export default adjustWebpackConfigs
