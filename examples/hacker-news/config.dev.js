import { declareRuntimeEnv } from '@reimagined/scripts'

const devConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
  eventstoreAdapter: {
    module: 'resolve-eventstore-lite',
    options: {
      databaseFile: 'data/event-store.db',
      secretsFile: 'data/secrets.db',
      snapshotBucketSize: 100,
    },
  },
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-model-default.db',
      },
    },
    hackerNews: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-model-hackerNews.db',
      },
    },
    comments: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-model-comments.db',
      },
    },
    elasticSearch: {
      module: 'common/read-models/elastic-search-connector.js',
      options: {
        /*
        node: "<your-cloud-elastic-search-host>:port",
        auth: {
          username: 'name',
          password: 'pass'
        }
        */
      },
    },
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
  eventBroker: {
    databaseFile: 'data/local-bus-broker.db',
  },
}

export default devConfig
