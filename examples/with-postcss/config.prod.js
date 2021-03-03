import { declareRuntimeEnv } from '@resolve-js/scripts'

const prodConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode:
    'production' /*,
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data/read-models.db'
      }
    }
  }*/,
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/event-store.db',
      secretsFile: 'data/secrets.db',
      snapshotBucketSize: 100,
    },
  },
  eventBroker: {
    databaseFile: 'data/local-bus-broker.db',
  },
}

export default prodConfig
