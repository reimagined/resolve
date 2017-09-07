const webpack = require('webpack');
const path = require('path');

module.exports = {
    name: 'client',
    entry: {
        client: ['regenerator-runtime/runtime', path.join(__dirname, '../client-index.js')]
    },
    output: {
        path: path.join(process.cwd(), './dist/static'),
        filename: 'bundle.js'
    },
    resolve: {
        alias: {
            RESOLVE_CLIENT_CONFIG: path.resolve(
                __dirname,
                path.join(process.cwd(), './resolve.client.config.js')
            )
        },
        modules: ['node_modules', path.resolve(__dirname, '../../node_modules')]
    },
    resolveLoader: {
        modules: ['node_modules', path.resolve(__dirname, '../../node_modules')]
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

    plugins: [
        new webpack.DefinePlugin({
            'process.env': 'window.__PROCESS_ENV__'
        })
    ]
};
