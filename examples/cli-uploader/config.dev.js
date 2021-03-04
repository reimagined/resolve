import { declareRuntimeEnv } from '@resolve-js/scripts'

const devConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/event-store.db',
      secretsFile: 'data/secrets.db',
      snapshotBucketSize: 100,
    },
  },
  readModelConnectors: {
    users: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data/read-model-users.db',
      },
    },
    files: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data/read-model-files.db',
      },
    },
  },
  uploadAdapter: {
    options: {
      directory: 'data',
      bucket: 'users',
      secretKey: 'key',
    },
  },
}

export default devConfig
