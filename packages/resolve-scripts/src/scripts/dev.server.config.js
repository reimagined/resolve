const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const StartServerPlugin = require('start-server-webpack-plugin');

const webpackServerConfig = require('../configs/webpack.server.config');

webpackServerConfig.entry.server = ['webpack/hot/poll?1000'].concat(
    webpackServerConfig.entry.server
);
webpackServerConfig.name = 'server';
webpackServerConfig.watch = true;
webpackServerConfig.externals = [nodeExternals({ whitelist: ['webpack/hot/poll?1000'] })];
webpackServerConfig.plugins = [
    new StartServerPlugin('server.js'),
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
].concat(webpackServerConfig.plugins || []);

module.exports = webpackServerConfig;
