import { declareRuntimeEnv } from '@resolve-js/scripts'

const devConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data/read-models.db',
        secretsFile: 'data/secrets.db',
      },
    },
  },
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/eventstore.db',
      secretsFile: 'data/secrets.db',
      snapshotBucketSize: 100,
    },
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
  uploadAdapter: {
    options: {
      directory: 'data',
      bucket: 'files',
      secretKey: 'key',
    },
  },
}

export default devConfig
