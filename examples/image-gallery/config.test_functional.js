import { declareRuntimeEnv } from 'resolve-scripts'

const testFunctionalConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
  rootPath: '',
  staticPath: 'static',
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {
      databaseFile: 'data/event-store-test-functional.db'
    }
  },
  staticDir: 'static',
  distDir: 'dist'
}

export default testFunctionalConfig
