const testFunctionalConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-models-test-functional.db'
      }
    }
  },
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {
      databaseFile: 'data/event-store-test-functional.db'
    }
  },
  eventBroker: {
    databaseFile: 'data/local-bus-broker-test-functional.db'
  }
}

export default testFunctionalConfig
