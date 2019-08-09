import { declareRuntimeEnv } from 'resolve-scripts'

const testFunctionalConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-model-default-test-functional.db'
      }
    },
    hackerNews: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-model-hackerNews-test-functional.db'
      }
    },
    comments: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-model-comments-test-functional.db'
      }
    },
    elasticSearch: {
      module: 'common/read-models/elastic-search-connector.js',
      options: {
        /*
        host: 'localhost:9200'
        */
      }
    }
  },
  schedulers: {
    scheduler: {
      adapter: {
        module: 'resolve-scheduler-local',
        options: {}
      },
      connectorName: 'default'
    }
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  },
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {
      databaseFile: 'data/event-store-test-functional.db'
    }
  },
  eventBroker: {
    databaseFile: 'data/local-bus-broker-test-functional.db'
  }
}

export default testFunctionalConfig
