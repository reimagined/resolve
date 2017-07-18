const webpack = require('webpack');
const path = require('path');

module.exports = env => ({
    name: 'client',
    entry: {
        client: ['regenerator-runtime/runtime', path.join(process.cwd(), './client/index.js')]
    },
    output: {
        publicPath: env ? env.publicPath : '',
        path: path.join(process.cwd(), './dist/static'),
        filename: 'bundle.js'
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
});
