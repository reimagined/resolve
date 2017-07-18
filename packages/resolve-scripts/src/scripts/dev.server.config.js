const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const StartServerPlugin = require('start-server-webpack-plugin');

const webpackServerConfig = require('../configs/webpack.server.config');

const serverConfig = webpackServerConfig();

serverConfig.entry.server = ['webpack/hot/poll?1000'].concat(serverConfig.entry.server);
serverConfig.name = 'server';
serverConfig.watch = true;
serverConfig.externals = [ nodeExternals({ whitelist: [ 'webpack/hot/poll?1000' ] }) ];
serverConfig.plugins = [
    new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    new StartServerPlugin('server.js'),
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
].concat(serverConfig.plugins || []);

module.exports = serverConfig;
