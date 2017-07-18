#!/usr/bin/env node

import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import devClientConfig from '../scripts/dev.client.config';
import devServerConfig from '../scripts/dev.server.config';

const clientCompiler = webpack(devClientConfig);

const clientDevServer = new WebpackDevServer(clientCompiler, {
    stats: {
        color: true
    },
    setup: (app) => {
        app.use((req, res, next) => {
            console.log(`Using middleware for ${req.url}`);
            next();
        })
    }
});

webpack(devServerConfig, (err, stats) => {
    process.stdout.write(stats.toString() + '\n');
})

clientDevServer.listen(3001, '127.0.0.1', () => {
    console.log('Starting server on http://localhost:3001');
})
