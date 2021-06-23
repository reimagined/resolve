import { declareRuntimeEnv } from '@resolve-js/scripts'
import devCommonConfig from './config.dev.common'

const devConfig = {
  ...devCommonConfig,
  port: declareRuntimeEnv('PORT', '3000'),
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/event-store.db',
      snapshotBucketSize: 100,
    },
  },
  /*readModels: [
    {
      name: 'Replicator',
      projection: 'common/read-models/empty.js',
      resolvers: 'common/read-models/empty.js',
      connectorName: 'replicator',
    },
  ],
  readModelConnectors: {
    ...devCommonConfig.readModelConnectors,
    replicator: {
      module: '@resolve-js/replicator-via-api-handler',
      options: {
        targetApplicationUrl: 'http://localhost:3001',
      },
    },
  },*/
}

export default devConfig
