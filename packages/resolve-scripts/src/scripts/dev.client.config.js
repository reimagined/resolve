const webpack = require('webpack');

const webpackClientConfig = require('../configs/webpack.client.config');

webpackClientConfig.output.publicPath = 'http://localhost:3001/';
webpackClientConfig.devtool = 'inline-source-map';
webpackClientConfig.entry.client = [
    'react-hot-loader/patch',
    'webpack-dev-server/client?http://localhost:3001',
    'webpack/hot/only-dev-server'
].concat(webpackClientConfig.entry.client);
webpackClientConfig.name = 'client';

const inputPlugins = (webpackClientConfig.plugins || []).filter(plug => plug && !plug.__PROD);

webpackClientConfig.plugins = [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
].concat(inputPlugins);

webpackClientConfig.devServer = {
    host: 'localhost',
    port: 3001,
    hot: true,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
            'Content-Type, Authorization, x-id, Content-Length, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    }
};

module.exports = webpackClientConfig;
