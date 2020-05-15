import { declareRuntimeEnv } from 'resolve-scripts'

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
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-models.db'
      }
    }
  },
  snapshotAdapter: {
    module: 'resolve-snapshot-lite',
    options: {
      // pathToFile: 'path/to/file',
      bucketSize: 100
    }
  },
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {
      databaseFile: 'data/storage.db',
      secretsFile: 'data/secrets.db'
    }
  },
  subscribeAdapter: {
    module: 'resolve-subscribe-socket.io',
    options: {}
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  },
  uploadAdapter: {
    module: 'resolve-upload-local',
    options: {
      directory: 'data',
      bucket: 'files',
      secretKey: 'key'
    }
  },
  schedulers: {
    scheduler: {
      adapter: {
        module: 'resolve-scheduler-local',
        options: {}
      },
      connectorName: 'default'
    }
  }
}

export default devConfig
