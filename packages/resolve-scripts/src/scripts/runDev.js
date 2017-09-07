import express from 'express';
import path from 'path';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import devClientConfig from './dev.client.config';
import devServerConfig from './dev.server.config';

import buildConfig from './build-config';
import outputConfig from './output-stats-config';

require('./clean');
require('./copy');

const PORT = parseInt(process.env.WEBPACK_PORT, 10) || 3001;
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

buildConfig.extendWebpack(devClientConfig, devServerConfig);

const clientCompiler = webpack(devClientConfig);

const clientDevServer = new WebpackDevServer(clientCompiler, {
    stats: outputConfig,
    setup: app => app.use(express.static(path.join(process.cwd(), './dist/static')))
});

webpack(devServerConfig, (err, stats) => {});

clientDevServer.listen(PORT, '127.0.0.1');
