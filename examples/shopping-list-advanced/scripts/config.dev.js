const devConfig = {
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  readModelAdapters: {
    ShoppingLists: {
      module: 'resolve-readmodel-memory',
      options: {}
    }
  }
}

module.exports = devConfig
