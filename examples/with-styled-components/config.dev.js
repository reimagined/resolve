const devConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  // readModelConnectors: {
  //   default: {
  //     module: 'resolve-readmodel-lite',
  //     options: {
  //       databaseFile: 'data/read-models.db'
  //     }
  //   }
  // },
  eventBroker: {
    launchBroker: false,
    databaseFile: 'data/local-bus-broker.db'
  }
}

export default devConfig
