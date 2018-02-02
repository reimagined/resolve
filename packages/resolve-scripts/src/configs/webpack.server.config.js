const nodeExternals = require('webpack-node-externals')
const path = require('path')

module.exports = {
  name: 'server',
  entry: {
    server: [
      'regenerator-runtime/runtime',
      path.join(__dirname, '../server/index.js')
    ]
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
      ),
      RESOLVE_CLIENT_CONFIG: path.resolve(
        __dirname,
        path.join(process.cwd(), './resolve.client.config.js')
      ),
      'resolve-scripts-auth': path.resolve(__dirname, '../server/auth')
    }
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
              presets: [['es2015', { modules: false }], 'stage-0', 'react']
            }
          }
        ],
        exclude: [/node_modules/]
      }
    ]
  },
  externals: [nodeExternals()]
}
