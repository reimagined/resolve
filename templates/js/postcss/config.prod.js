import { declareRuntimeEnv } from '@resolve-js/scripts'
const prodConfig = {
  mode: 'production',
  runtime: {
    module: '@resolve-js/runtime-single-process',
    options: {
      host: declareRuntimeEnv('HOST', 'localhost'),
      port: declareRuntimeEnv('PORT', '3000'),
    },
  } /*,
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
}
export default prodConfig
