// eslint-disable-next-line no-unused-vars
const adjustWebpackConfigs = (webpackConfigs: any[]): void => {
  // enable-ts
  for (const webpackConfig of webpackConfigs) {
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
}
export default adjustWebpackConfigs
