const path = require('path')
const { babelify } = require('./babel.compile')

const adjustWebpackConfigs = async (
  resolveConfig,
  { watch },
  webpackConfigs
) => {
  await babelify({ watch })

  for (const webpackConfig of webpackConfigs) {
    webpackConfig.resolve.modules = [
      path.join(__dirname, 'node_modules'),
      path.join(__dirname, '..', 'web', 'node_modules'),
      path.join(__dirname, '..', 'domain', 'node_modules')
    ]
  }

  const [webpackWebConfig] = webpackConfigs

  const webpackNativeConfig = {
    ...webpackWebConfig,
    resolve: {
      ...webpackWebConfig.resolve,
      modules: [
        path.join(__dirname, 'node_modules'),
        path.join(__dirname, '..', 'native', 'node_modules'),
        path.join(__dirname, '..', 'domain', 'node_modules')
      ]
    },
    name: 'Common Business Logic',
    entry: {
      'resolve/config': path.resolve(__dirname, './alias/config.js')
    },
    output: {
      path: path.resolve(__dirname, '../native'),
      libraryTarget: 'commonjs-module'
    }
  }

  webpackConfigs.push(webpackNativeConfig)
}

module.exports = adjustWebpackConfigs
