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
    users: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-model-users.db'
      }
    },
    files: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-model-files.db'
      }
    }
  },
  uploadAdapter: {
    module: 'resolve-upload-local',
    options: {
      directory: 'data',
      bucket: 'users',
      secretKey: 'key'
    }
  }
}

export default devConfig
