import devCommonConfig from './config.dev.common'
//import { declareRuntimeEnv } from '@resolve-js/scripts'
const devConfig = {
  ...devCommonConfig,
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/event-store.db',
      snapshotBucketSize: 100,
    },
  },
  /*eventstoreAdapter: {
      module: '@resolve-js/eventstore-postgresql',
      options: {
        database: declareRuntimeEnv('POSTGRES_DATABASE'),
        host: declareRuntimeEnv('POSTGRES_HOST'),
        port: declareRuntimeEnv('POSTGRES_PORT'),
        user: declareRuntimeEnv('POSTGRES_USER'),
        password: declareRuntimeEnv('POSTGRES_PASSWORD'),
        databaseName: 'source',
        snapshotBucketSize: 100,
      },
    },*/
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
          targetApplicationUrl: declareRuntimeEnv('TARGET_REPLICATION_URL', ''),
        },
      },
    },*/
}
export default devConfig
