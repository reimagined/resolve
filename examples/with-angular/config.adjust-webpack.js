import { AngularCompilerPlugin } from '@ngtools/webpack'
import FilterWarningsPlugin from 'webpack-filter-warnings-plugin'
import { getModulesDirs } from '@resolve-js/scripts'
import path from 'path'

const adjustClientEntry = (webpackConfig) => {
  const {
    module: { rules },
    resolve,
    plugins,
  } = webpackConfig

  rules.push({
    test: /\.ts$/,
    loaders: '@ngtools/webpack',
    exclude: [/node_modules/, ...getModulesDirs({ isAbsolutePath: true })],
  })

  resolve.extensions = ['.ts', '.js']

  plugins.push(
    new AngularCompilerPlugin({
      platform: 0,
      entryModule: path.join(
        __dirname,
        'client',
        'app',
        'app.module#AppModule'
      ),
      sourceMap: true,
      tsConfigPath: path.join(__dirname, 'tsconfig.json'),
      skipCodeGeneration: true,
    })
  )

  // Warning suppression below is left intentionally, since Angular loader
  // and compiler generates empty context for "$$_lazy_route_resource" via
  // "System.import" mechanism. This is not reSolve example issue, since
  // native cli command "npx ng build --aot" performs such operation.
  plugins.push(
    new FilterWarningsPlugin({
      exclude: /System.import/,
    })
  )
}

const adjustWebpackConfigs = (webpackConfigs) => {
  const clientEntry = webpackConfigs.find(
    ({ entry, target }) =>
      Object.keys(entry).find((entry) => entry.endsWith('client/index.js')) !=
        null && target === 'web'
  )

  adjustClientEntry(clientEntry)
}

export default adjustWebpackConfigs
