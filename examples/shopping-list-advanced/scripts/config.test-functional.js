const testFunctionalConfig = {
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',

  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {}
  }
}

module.exports = testFunctionalConfig
