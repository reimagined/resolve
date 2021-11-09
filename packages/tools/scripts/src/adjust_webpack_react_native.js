import path from 'path'
import nodeExternals from 'webpack-node-externals'

import getModulesDirs from './get_modules_dirs'

const isString = (val) => val != null && val.constructor === String
const resolvePackages = JSON.parse(process.env.__RESOLVE_PACKAGES__ ?? '')

const adjustWebpackReactNative = ({ resolveConfig, reactNativeDir }) => (
  webpackConfigs,
  { alias }
) => {
  const isClient = true

  if (!isString(reactNativeDir)) {
    throw new Error('The `reactNativeDir` field must be String')
  }

  const webpackNativeConfig = {
    name: 'React Native Chunk',
    mode: resolveConfig.mode,
    performance: false,
    devtool: 'source-map',
    target: 'web',
    context: path.resolve(process.cwd()),
    resolve: {
      alias,
      modules: [],
    },
    entry: '$resolve.chunkReactNative',
    output: {
      path: reactNativeDir,
      libraryTarget: 'commonjs-module',
      filename: 'resolve/index.js',
      devtoolModuleFilenameTemplate: '[namespace][resource-path]',
      devtoolFallbackModuleFilenameTemplate:
        '[namespace][resource-path]?[hash]',
    },
    module: {
      rules: [
        {
          test: Object.values(alias),
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: {
                cacheDirectory: true,
                babelrc: false,
                presets: ['@babel/preset-env', '@babel/preset-react'],
                plugins: [
                  '@babel/plugin-proposal-class-properties',
                  '@babel/plugin-proposal-export-default-from',
                  '@babel/plugin-proposal-export-namespace-from',
                  [
                    '@babel/plugin-transform-runtime',
                    {
                      corejs: false,
                      helpers: true,
                      regenerator: true,
                      useESModules: false,
                    },
                  ],
                ],
              },
            },
            {
              loader: require.resolve('./val_query_loader'),
              options: {
                resolveConfig,
                isClient,
              },
            },
          ],
        },
        {
          test: /\.js$/,
          use: {
            loader: require.resolve('babel-loader'),
            options: {
              cacheDirectory: true,
            },
          },
          exclude: [
            /node_modules/,
            ...getModulesDirs({ isAbsolutePath: true }),
            path.resolve(__dirname, '../lib'),
            path.resolve(__dirname, '../es'),
          ],
        },
      ],
    },
    externals: getModulesDirs().map((modulesDir) =>
      nodeExternals({
        modulesDir,
        importType: (moduleName) => `((() => {
        const resolvePackages = ${JSON.stringify(resolvePackages)}
        const path = require('path')
        const requireDirs = ['', ...resolvePackages.map(pkg => \`\${pkg}/node_modules/\`)]
        let modulePath = null
        const moduleName = ${JSON.stringify(moduleName)}
        for(const dir of requireDirs) {
          try {
            modulePath = require.resolve(path.join(dir, moduleName))
            break
          } catch(err) {}
        }
        if(modulePath == null) {
          throw new Error(\`Cannot resolve the module "\${moduleName}"\`)
        }
        return require(modulePath)
      })())`,
      })
    ),
  }

  webpackConfigs.push(webpackNativeConfig)
}

export default adjustWebpackReactNative
