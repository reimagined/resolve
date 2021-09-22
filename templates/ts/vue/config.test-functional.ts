import { declareRuntimeEnv } from '@resolve-js/scripts'

const testFunctionalConfig = {
  mode: 'development',
  runtime: {
    module: '@resolve-js/runtime-dev',
    options: {
      host: declareRuntimeEnv('HOST', 'localhost'),
      port: declareRuntimeEnv('PORT', '3000'),
    },
  },
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/event-store-test-functional.db',
      secretsFile: 'data/secrets-test-functional.db',
    },
  },
}

export default testFunctionalConfig
