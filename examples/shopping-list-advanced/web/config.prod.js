const { declareRuntimeEnv } = require('resolve-scripts')

const prodConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  polyfills: ['@babel/polyfill'],
  mode: 'production',
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
