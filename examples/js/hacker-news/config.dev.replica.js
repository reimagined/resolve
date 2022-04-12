import devCommonConfig from './config.dev.common'
import { declareRuntimeEnv } from '@resolve-js/scripts'
const devReplicaConfig = {
  ...devCommonConfig,
  name: 'hacker-news-replica',
  runtime: {
    module: '@resolve-js/runtime-single-process',
    options: {
      host: declareRuntimeEnv('REPLICA_HOST', 'localhost'),
      port: declareRuntimeEnv('REPLICA_PORT', '4001'),
    },
  },
  distDir: 'dist-replica',
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data-replica/event-store.db',
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
        databaseName: 'replica',
        snapshotBucketSize: 100,
      },
    },*/
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data-replica/read-model-default.db',
      },
    },
    elasticSearch: {
      module: 'common/read-models/elastic-search-connector.js',
      options: {
        /*
            node: "<your-cloud-elastic-search-host>:port",
            auth: {
              username: 'name',
              password: 'pass'
            }
            */
      },
    },
  },
}
export default devReplicaConfig
