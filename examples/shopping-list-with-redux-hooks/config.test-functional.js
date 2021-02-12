import { declareRuntimeEnv } from '@reimagined/scripts'

const testFunctionalConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
  readModelConnectors: {
    default: {
      module: '@reimagined/readmodel-lite',
      options: {
        databaseFile: 'data/read-models-test-functional.db',
      },
    },
  },
  eventstoreAdapter: {
    module: '@reimagined/eventstore-lite',
    options: {
      databaseFile: 'data/event-store-test-functional.db',
      secretsFile: 'data/secrets-test-functional.db',
    },
  },
  eventBroker: {
    databaseFile: 'data/local-bus-broker-test-functional.db',
  },
}

export default testFunctionalConfig
