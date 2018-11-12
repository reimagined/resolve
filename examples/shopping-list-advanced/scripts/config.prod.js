const prodConfig = {
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'production',
  readModelAdapters: {
    ShoppingLists: {
      module: 'resolve-readmodel-memory',
      options: {}
    }
  }
}

module.exports = prodConfig
