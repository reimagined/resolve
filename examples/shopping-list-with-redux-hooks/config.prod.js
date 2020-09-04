import { declareRuntimeEnv } from 'resolve-scripts'

const prodConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'production',
  eventstoreAdapter: {
    module: 'resolve-eventstore-lite',
    options: {
      databaseFile: 'data/event-store.db',
      secretsFile: 'data/secrets.db',
      snapshotBucketSize: 100,
    },
  },
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-models.db',
      },
    },
  },
  eventBroker: {
    databaseFile: 'data/local-bus-broker.db',
  },
}

export default prodConfig
