import { declareRuntimeEnv } from 'resolve-scripts'

const devConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
  // readModelConnectors: {
  //   default: {
  //     module: 'resolve-readmodel-lite',
  //     options: {
  //       databaseFile: 'data/read-models.db'
  //     }
  //   }
  // },
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {
      databaseFile: 'data/event-store.db'
    }
  },
  eventBroker: {
    launchBroker: false,
    databaseFile: 'data/local-bus-broker.db'
  }
}

export default devConfig
