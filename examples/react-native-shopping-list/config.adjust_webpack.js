import path from 'path'

const adjustWebpackConfigs = (resolveConfig, webpackConfigs) => {
  const [webpackWebConfig] = webpackConfigs

  const webpackNativeConfig = {
    ...webpackWebConfig,
    name: 'Common Business Logic',
    entry: {
      'resolve/config': path.resolve(__dirname, 'native/build/config.js'),
      'resolve/resolve-redux': require.resolve('resolve-redux', {
        paths: webpackWebConfig.resolve.modules
      })
    },
    output: {
      path: path.resolve(__dirname, 'native'),
      libraryTarget: 'commonjs-module'
    },
    module: {
      rules: [
        ...webpackWebConfig.module.rules,
        {
          test: [path.resolve(__dirname, 'native/build/origin.js')],
          use: [
            {
              loader: 'babel-loader'
            },
            {
              loader: 'val-loader',
              options: {
                resolveConfig,
                isClient: true
              }
            },
            {
              loader: 'babel-loader'
            }
          ]
        }
      ]
    }
  }

  webpackConfigs.push(webpackNativeConfig)
}

export default adjustWebpackConfigs
