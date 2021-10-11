import { declareRuntimeEnv } from '@resolve-js/scripts'
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
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data/read-models-test-functional.db',
      },
    },
  },
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/event-store-test-functional.db',
      secretsFile: 'data/secrets-test-functional.db',
    },
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
}
export default testFunctionalConfig
