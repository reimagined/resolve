import { declareRuntimeEnv } from 'resolve-scripts'

const devConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {
      databaseFile: ':memory:'
    }
  },
  snapshotAdapter: {
    module: 'resolve-snapshot-lite',
    options: {
      databaseFile: ':memory:',
      bucketSize: 1
    }
  },
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: ':memory:'
      }
    },
    hackerNews: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: ':memory:'
      }
    },
    comments: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: ':memory:'
      }
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
  eventBroker: {
    databaseFile: ':memory:'
  }
}

export default devConfig
