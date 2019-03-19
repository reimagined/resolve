const testFunctionalConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {}
    }
  },
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {}
  }
}

module.exports = testFunctionalConfig
