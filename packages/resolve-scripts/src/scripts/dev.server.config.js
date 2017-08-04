const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const StartServerPlugin = require('start-server-webpack-plugin');

const webpackServerConfig = require('../configs/webpack.server.config');

if(!webpackServerConfig.plugins) {
    webpackServerConfig.plugins = [];
}

webpackServerConfig.plugins.push(
    new webpack.BannerPlugin({
        banner: 'require("source-map-support").install();',
        raw: true,
        entryOnly: false
    })
);

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
