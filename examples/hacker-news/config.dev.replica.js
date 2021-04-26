import devCommonConfig from './config.dev.common'

const devReplicaConfig = {
  ...devCommonConfig,
  name: 'hacker-news-replica',
  port: '3001',
  distDir: 'dist-replica',
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data-replica/event-store.db',
      snapshotBucketSize: 100,
    },
  },
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data-replica/read-model-default.db',
      },
    },
    hackerNews: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data-replica/read-model-hackerNews.db',
      },
    },
    comments: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data-replica/read-model-comments.db',
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
  apiHandlers: [
    {
      path: '/api/replication-state',
      handler: 'common/api-handlers/replication_state.js',
      method: 'GET',
    },
    {
      path: '/api/pause-replication',
      handler: 'common/api-handlers/pause_replication.js',
      method: 'POST',
    },
    {
      path: '/api/resume-replication',
      handler: 'common/api-handlers/resume_replication.js',
      method: 'POST',
    },
    {
      path: '/api/replicate',
      handler: 'common/api-handlers/replicate.js',
      method: 'POST',
    },
    {
      path: '/api/replicated-events',
      handler: 'common/api-handlers/replicated_events.js',
      method: 'GET',
    },
    {
      path: '/api/reset-replication',
      handler: 'common/api-handlers/reset_replication.js',
      method: 'POST',
    },
  ],
}

export default devReplicaConfig
