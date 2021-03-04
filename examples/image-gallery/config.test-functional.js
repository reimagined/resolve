import { declareRuntimeEnv } from '@resolve-js/scripts'

const testFunctionalConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
  rootPath: '',
  staticPath: 'static',
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/event-store-test-functional.db',
    },
  },
  staticDir: 'static',
  distDir: 'dist',
}

export default testFunctionalConfig
