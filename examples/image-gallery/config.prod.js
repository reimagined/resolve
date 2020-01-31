import { declareRuntimeEnv } from 'resolve-scripts'

const prodConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'production',
  rootPath: '',
  staticPath: 'static',
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {
      databaseFile: 'data/event-store.db'
    }
  },
  staticDir: 'static',
  distDir: 'dist'
}

export default prodConfig
