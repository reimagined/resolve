import { declareRuntimeEnv } from 'resolve-scripts'

const readModelOptions = {
  dbClusterOrInstanceArn: 'arn:aws:rds:eu-west-1:169462466426:cluster:event-store-postgres',
  awsSecretStoreArn: 'arn:aws:secretsmanager:eu-west-1:169462466426:secret:prod/postgresUser/-LkrvYIjdRh5ZxJs-RGxUkC',
  databaseName: 'readmodel-ct8rdp5ftqjtlkzq4lfcjlosnlv2',
  region: 'eu-west-1',
  accessKeyId: 'AKIASO5GAA55M4OYK2FT',
  secretAccessKey: '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',
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
