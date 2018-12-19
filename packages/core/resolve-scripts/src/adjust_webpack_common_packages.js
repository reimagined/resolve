import path from 'path'

import getModulesDirs from './get_modules_dirs'

const isString = val => val != null && val.constructor === String

const adjustWebpackCommonPackages = ({ commonPackages }) => webpackConfigs => {
  if (
    Object(commonPackages) !== commonPackages ||
    !Object.keys(commonPackages).every(isString) ||
    !Object.values(commonPackages).every(isString)
  ) {
    throw new Error('The `commonPackages` field must be Object<String, String>')
  }

  for (const webpackConfig of webpackConfigs) {
    webpackConfig.resolve.modules = [
      path.join(process.cwd(), 'node_modules'), // TODO. Hot-fix
      'node_modules'
    ]
    webpackConfig.module.rules[1].use.options.plugins = [
      ...(webpackConfig.module.rules[1].use.options.plugins || []),
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          alias: commonPackages
        }
      ]
    ]
    webpackConfig.module.rules.push({
      test: /\.js$/,
      include: Object.values(commonPackages),
      exclude: [
        /node_modules/,
        ...getModulesDirs({ isAbsolutePath: true }),
        path.resolve(__dirname, '../lib'),
        path.resolve(__dirname, '../es')
      ],
      use: {
        loader: require.resolve('babel-loader'),
        options: {
          cacheDirectory: true,
          plugins: [
            [
              require.resolve('babel-plugin-module-resolver'),
              {
                alias: commonPackages
              }
            ]
          ]
        }
      }
    })
  }
}

export default adjustWebpackCommonPackages
