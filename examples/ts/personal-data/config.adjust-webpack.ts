// eslint-disable-next-line no-unused-vars
const adjustWebpackConfigs = (webpackConfigs: any[]): void => {
  // enable-ts
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
      },
    })
    resolve.extensions = ['.js', '.jsx', '.ts', '.tsx']
  }
  // enable-ts
}
export default adjustWebpackConfigs
