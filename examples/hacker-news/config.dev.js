import { declareRuntimeEnv } from 'resolve-scripts'

const readModelOptions = {
  dbClusterOrInstanceArn: 'xxx',
  awsSecretStoreArn: 'xxx',
  databaseName: 'readmodel-ct8rdp5ftqjtlkzq4lfcjlosnlv2',
  region: 'eu-west-1',
  accessKeyId: 'xxx',
  secretAccessKey: 'xxx',
  preferInlineLedger: true
}

const devConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
  eventstoreAdapter: {
    module: 'resolve-eventstore-lite',
    options: {
      databaseFile: 'data/event-store.db',
      secretsFile: 'data/secrets.db',
      snapshotBucketSize: 100
    }
  },
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-postgresql-serverless',
      options: readModelOptions
    },
    hackerNews: {
      module: 'resolve-readmodel-postgresql-serverless',
      options: readModelOptions
    },
    comments: {
      module: 'resolve-readmodel-postgresql-serverless',
      options: readModelOptions
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
    databaseFile: 'data/local-bus-broker.db'
  }
}

export default devConfig
