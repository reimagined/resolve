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

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

buildConfig.extendWebpack(devClientConfig, devServerConfig);

const clientCompiler = webpack(devClientConfig);

const clientDevServer = new WebpackDevServer(clientCompiler, {
    stats: outputConfig,
    setup: (app) => {
        app.use((req, res, next) => {
            // eslint-disable-next-line no-console
            console.log(`Using middleware for ${req.url}`);
            next();
        });
        app.use(express.static(path.join(process.cwd(), './dist/static')));
    }
});

webpack(devServerConfig, (err, stats) => {
    process.stdout.write(stats.toString(outputConfig) + '\n');
});

clientDevServer.listen(3001, '127.0.0.1', () => {
    // eslint-disable-next-line no-console
    console.log('Starting server on http://localhost:3001');
});
