const devConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  redux: {
    enhancers: ['client/redux/enhancers/redux-devtools.js']
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

module.exports = devConfig
