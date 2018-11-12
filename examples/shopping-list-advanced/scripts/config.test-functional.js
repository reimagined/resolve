const testFunctionalConfig = {
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',

  readModelAdapters: {
    ShoppingLists: {
      module: 'resolve-readmodel-memory',
      options: {}
    }
  },
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {}
  }
}

module.exports = testFunctionalConfig
