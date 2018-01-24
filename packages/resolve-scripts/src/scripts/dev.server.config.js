const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const StartServerPlugin = require('start-server-webpack-plugin')

const webpackServerConfig = require('../configs/webpack.server.config')
const babelPluginObjectSource = require('babel-plugin-object-source')
webpackServerConfig.devtool = 'inline-source-map'

if (!webpackServerConfig.plugins) {
  webpackServerConfig.plugins = []
}

webpackServerConfig.plugins.push(
  new webpack.BannerPlugin({
    banner: 'require("source-map-support").install();',
    raw: true,
    entryOnly: false
  })
)

webpackServerConfig.entry.server = ['webpack/hot/poll?1000'].concat(
  webpackServerConfig.entry.server
)
webpackServerConfig.name = 'server'
webpackServerConfig.watch = true
webpackServerConfig.externals = [
  nodeExternals({ whitelist: ['webpack/hot/poll?1000'] })
]
webpackServerConfig.plugins = [
  new StartServerPlugin('server.js'),
  new webpack.NamedModulesPlugin(),
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoEmitOnErrorsPlugin()
].concat(webpackServerConfig.plugins || [])

webpackServerConfig.module.rules.forEach(rule =>
  rule.loaders.filter(({ loader }) => loader === 'babel-loader').forEach(
    loader =>
      (loader.query.presets = [
        {
          plugins: [babelPluginObjectSource]
        }
      ].concat(Array.isArray(loader.query.presets) ? loader.query.presets : []))
  )
)

module.exports = webpackServerConfig
