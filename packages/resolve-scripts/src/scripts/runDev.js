import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import devClientConfig from './dev.client.config';
import devServerConfig from './dev.server.config';

import buildConfig from './build-config';

require('./clean');
require('./copy');

buildConfig.extendWebpack(devClientConfig, devServerConfig);

const clientCompiler = webpack(devClientConfig);

const clientDevServer = new WebpackDevServer(clientCompiler, {
    stats: {
        colors: true
    },
    setup: (app) => {
        app.use((req, res, next) => {
            // eslint-disable-next-line no-console
            console.log(`Using middleware for ${req.url}`);
            next();
        });
    }
});

webpack(devServerConfig, (err, stats) => {
    process.stdout.write(
        stats.toString({ colors: true }) + '\n'
    );
});

clientDevServer.listen(3001, '127.0.0.1', () => {
    // eslint-disable-next-line no-console
    console.log('Starting server on http://localhost:3001');
});
