const { declareRuntimeEnv } = require('resolve-scripts')

const prodConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'production',
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {
      databaseFile: 'data/event-store.db'
    }
  },
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-models.db'
      }
    }
  },
  eventBroker: {
    databaseFile: 'data/local-bus-broker.db'
  }
}

module.exports = prodConfig
