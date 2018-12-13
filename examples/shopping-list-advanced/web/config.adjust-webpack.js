const fs = require('fs')
const path = require('path')
const babelrc = JSON.parse(fs.readFileSync(
  path.join(__dirname, '.babelrc')
))

console.log(babelrc)

const adjustWebpackConfigs = async (
  resolveConfig,
  _, //{ watch },
  webpackConfigs
) => {
  for (const webpackConfig of webpackConfigs) {
    webpackConfig.resolve.alias['@shopping-list-advanced/ui'] =  path.join(__dirname, '..', 'ui')
    
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
           // cacheDirectory: true,
            babelrc: false,
            ...babelrc
          }
        }
      }
    )
   
  }

  // const [webpackClientConfig, webpackServerConfig] = webpackConfigs
  //
  // const webpackNativeConfig = {
  //   ...webpackClientConfig,
  //   resolve: {
  //     ...webpackClientConfig.resolve,
  //     modules: [
  //       path.join(__dirname, '..', 'native', 'node_modules')
  //     ]
  //   },
  //   name: 'Common Business Logic',
  //   entry: {
  //     'resolve/config': path.resolve(__dirname, './chunk-native-entry.js')
  //   },
  //   output: {
  //     path: path.resolve(__dirname, '../native'),
  //     libraryTarget: 'commonjs-module'
  //   },
  //   externals: webpackServerConfig.externals.slice(1)
  // }
  //
  // webpackConfigs.push(webpackNativeConfig)
}

module.exports = adjustWebpackConfigs
