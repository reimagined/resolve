import { declareRuntimeEnv } from '@reimagined/scripts'

const prodConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'production',
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  readModelConnectors: {
    default: {
      module: '@reimagined/readmodel-lite',
      options: {
        databaseFile: 'data/read-models.db',
      },
    },
  },
  eventstoreAdapter: {
    module: '@reimagined/eventstore-lite',
    options: {
      databaseFile: 'data/event-store.db',
      secretsFile: 'data/secrets.db',
      snapshotBucketSize: 100,
    },
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
}

export default prodConfig
