const path = require('path')

const adjustWebpackConfigs = async (
  resolveConfig,
  webpackConfigs,
  {
    alias,
    nodeModulesByAssembly
  }
) => {
  for (const webpackConfig of webpackConfigs) {
    webpackConfig.resolve.modules = [
      path.resolve(__dirname, path.join(__dirname, 'node_modules'))
    ]
    webpackConfig.module.rules.push(
      {
        test: [
          path.join(__dirname, '..', 'ui', 'src', 'index.js'),
          path.join(__dirname, '..', 'ui', 'src', 'Logo.js')
        ],
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      }
    )
  }

  const [webpackClientConfig, webpackServerConfig] = webpackConfigs

  const webpackNativeConfig = {
    ...webpackClientConfig,
    resolve: {
      ...webpackClientConfig.resolve,
      modules: [
        path.join(__dirname, '..', 'native', 'node_modules')
      ]
    },
    name: 'Common Business Logic',
    entry: {
      'resolve/config': path.resolve(__dirname, './chunk-native-entry.js')
    },
    output: {
      path: path.resolve(__dirname, '../native'),
      libraryTarget: 'commonjs-module'
    },
    externals: webpackServerConfig.externals.slice(1)
  }

  webpackConfigs.push(webpackNativeConfig)
}

module.exports = adjustWebpackConfigs
