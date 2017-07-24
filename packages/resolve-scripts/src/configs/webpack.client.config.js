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
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loaders: [
                    {
                        loader: 'babel-loader',
                        query: {
                            presets: [['es2015', { modules: false }], 'stage-0', 'react']
                        }
                    }
                ],
                exclude: [/node_modules/]
            }
        ]
    },

    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        })
    ]
};
