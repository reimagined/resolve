import path from 'path'

const adjustWebpackConfigs = (resolveConfig, webpackConfigs) => {
  const [webpackWebConfig] = webpackConfigs

  const modules = webpackWebConfig.resolve.modules

  const webpackNativeConfig = {
    ...webpackWebConfig,
    name: 'Common Business Logic',
    entry: {
      'resolve/config': path.resolve(__dirname, 'native/build/config.js'),
      'resolve/resolve-redux': require.resolve('resolve-redux', {
        paths: modules
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
                modules,
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
