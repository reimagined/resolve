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
  uploadAdapter: {
    module: 'resolve-upload-local',
    options: {
      directory: 'data',
      bucket: 'files',
      secretKey: 'key'
    }
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  }
}

export default devConfig
