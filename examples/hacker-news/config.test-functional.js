import { declareRuntimeEnv } from 'resolve-scripts'

const testFunctionalConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-model-default-test-functional.db',
      },
    },
    hackerNews: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-model-hackerNews-test-functional.db',
      },
    },
    comments: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-model-comments-test-functional.db',
      },
    },
    elasticSearch: {
      module: 'common/read-models/elastic-search-connector.js',
      options: {
        /*
        host: 'localhost:9200'
        */
      },
    },
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
  eventstoreAdapter: {
    module: 'resolve-eventstore-lite',
    options: {
      databaseFile: 'data/event-store-test-functional.db',
      secretsFile: 'data/secrets-test-functional.db',
      snapshotBucketSize: 100,
    },
  },
  eventBroker: {
    databaseFile: 'data/local-bus-broker-test-functional.db',
  },
}

export default testFunctionalConfig
