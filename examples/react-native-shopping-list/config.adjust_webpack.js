import path from 'path'

const adjustWebpackConfigs = (resolveConfig, webpackConfigs, { alias }) => {
  const [webpackWebConfig] = webpackConfigs

  const webpackNativeConfig = {
    ...webpackWebConfig,
    name: 'Common Business Logic',
    entry: {
      'resolve/config': path.resolve(__dirname, 'native/build/config.js')
    },
    resolve: {
      ...webpackWebConfig.resolve,
      alias: {
        ...alias,
        '$resolve.origin': path.resolve(__dirname, 'native/build/origin.js')
      }
    },
    output: {
      path: path.resolve(__dirname, 'native'),
      libraryTarget: 'commonjs-module'
    },
    module: {
      rules: [
        ...webpackWebConfig.module.rules,
        {
          test: path.resolve(__dirname, 'native/build/origin.js'),
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

export default adjustWebpackConfigs
