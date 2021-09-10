const adjustWebpackConfigs = (webpackConfigs: any[]): void => {
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
}
export default adjustWebpackConfigs
