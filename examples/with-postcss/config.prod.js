const prodConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode:
    'production' /*,
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'read-models.db'
      }
    }
  }*/,
  eventBroker: {
    launchBroker: false,
    databaseFile: 'local-bus-broker.db'
  }
}

export default prodConfig
