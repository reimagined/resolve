const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = {
    name: 'server',
    entry: {
        server: ['regenerator-runtime/runtime', path.join(__dirname, '../server/index.js')]
    },
    target: 'node',
    node: {
        __dirname: true,
        __filename: true
    },
    resolve: {
        alias: {
            RESOLVE_SERVER_CONFIG: path.resolve(
                __dirname,
                path.join(process.cwd(), './resolve.server.config.js')
            )
        },
        modules: ['node_modules', path.resolve(__dirname, '../../node_modules')]
    },
    resolveLoader: {
        modules: ['node_modules', path.resolve(__dirname, '../../node_modules')]
    },
    output: {
        path: path.join(process.cwd(), './dist/server'),
        filename: 'server.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loaders: [
                    {
                        loader: 'babel-loader',
                        query: {
                            presets: [
                                [
                                    path.resolve(
                                        __dirname,
                                        '../../node_modules/babel-preset-es2015'
                                    ),
                                    { modules: false }
                                ],
                                path.resolve(__dirname, '../../node_modules/babel-preset-stage-0'),
                                path.resolve(__dirname, '../../node_modules/babel-preset-react')
                            ]
                        }
                    }
                ],
                exclude: [/node_modules/]
            }
        ]
    },
    externals: [nodeExternals()]
};
