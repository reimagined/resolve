import { declareRuntimeEnv } from '@resolve-js/scripts'

const prodConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'production',
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/event-store.db',
      secretsFile: 'data/secrets.db',
      snapshotBucketSize: 100,
    },
  },
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data/read-models.db',
      },
    },
  },
}

export default prodConfig
