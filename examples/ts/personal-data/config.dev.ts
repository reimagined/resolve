import { declareRuntimeEnv } from '@resolve-js/scripts'

const devConfig = {
  mode: 'development',
  runtime: {
    module: '@resolve-js/runtime-single-process',
    options: {
      host: declareRuntimeEnv('HOST', 'localhost'),
      port: declareRuntimeEnv('PORT', '3000'),
      emulateWorkerLifetimeLimit: 240000,
    },
  },
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
