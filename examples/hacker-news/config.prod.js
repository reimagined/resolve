import { declareRuntimeEnv } from '@resolve-js/scripts'

const prodConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'production',
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/event-store.db',
      secretsFile: 'data/secrets.db',
      snapshotBucketSize: 100,
    },
  },
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data/read-model-default.db',
        secretsFile: 'data/secrets.db',
      },
    },
    hackerNews: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data/read-model-hackerNews.db',
      },
    },
    comments: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data/read-model-comments.db',
      },
    },
    elasticSearch: {
      module: 'common/read-models/elastic-search-connector.js',
      options: {
        /*
        host: '<your-production-elastic-search-host>'
        */
      },
    },
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
}

export default prodConfig
