const path = require('path')
const { babelify } = require('./babel.compile')

const adjustWebpackConfigs = async (
  resolveConfig,
  { watch },
  webpackConfigs
) => {
  await babelify({ watch })

  const [webpackWebConfig] = webpackConfigs

  const webpackNativeConfig = {
    ...webpackWebConfig,
    name: 'Common Business Logic',
    entry: {
      'resolve/config': path.resolve(__dirname, './alias/config.js'),
      'resolve/resolve-redux': require.resolve('resolve-redux', {
        paths: webpackWebConfig.resolve.modules
      })
    },
    output: {
      path: path.resolve(__dirname, '../native'),
      libraryTarget: 'commonjs-module'
    },
    module: {
      rules: [
        ...webpackWebConfig.module.rules,
        {
          test: [path.resolve(__dirname, './alias/origin.js')],
          use: [
            {
              loader: 'val-loader',
              options: {
                resolveConfig,
                isClient: true
              }
            }
          ]
        }
      ]
    }
  }

  webpackConfigs.push(webpackNativeConfig)
}

module.exports = adjustWebpackConfigs
