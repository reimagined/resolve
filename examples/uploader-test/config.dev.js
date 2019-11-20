import { declareRuntimeEnv } from 'resolve-scripts'

const devConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  uploadAdapter: {
    module: 'resolve-upload-local',
    options: {
      launchServer: true,
      protocol: 'http',
      host: 'localhost',
      port: 3001,
      directory: 'data',
      bucket: 'files',
      secretKey: 'key'
    }
  }
}

export default devConfig
