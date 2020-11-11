import { declareRuntimeEnv } from 'resolve-scripts'

const testFunctionalConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-models-test-functional.db',
      },
    },
  },
  schedulers: {
    scheduler: {
      adapter: {
        module: 'resolve-scheduler-local',
        options: {},
      },
      connectorName: 'default',
    },
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
  eventstoreAdapter: {
    module: 'resolve-eventstore-lite',
    options: {
      databaseFile: 'data/event-store-test-functional.db',
      secretsFile: 'data/secrets-test-functional.db',
    },
  },
  uploadAdapter: {
    module: 'resolve-upload-local',
    options: {
      directory: 'data',
      bucket: 'files',
      secretKey: 'key',
    },
  },
}

export default testFunctionalConfig
