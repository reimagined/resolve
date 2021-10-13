import { declareRuntimeEnv } from '@resolve-js/scripts'
const testFunctionalConfig = {
  mode: 'development',
  runtime: {
    module: '@resolve-js/runtime-single-process',
    options: {
      host: declareRuntimeEnv('HOST', 'localhost'),
      port: declareRuntimeEnv('PORT', '3000'),
    },
  },
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
