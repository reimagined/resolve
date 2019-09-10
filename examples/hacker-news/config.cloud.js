import { declareRuntimeEnv } from 'resolve-scripts'

export default {
  target: 'cloud',
  mode: 'production',
  staticPath: declareRuntimeEnv('RESOLVE_CLOUD_STATIC_URL'),
  subscribeAdapter: {
    module: 'resolve-subscribe-mqtt',
    options: {}
  },
  storageAdapter: {
    module: 'resolve-storage-postgresql-serverless',
    options: {
      awsSecretStoreArn: declareRuntimeEnv('RESOLVE_ES_SECRET_STORE_ARN'),
      dbClusterOrInstanceArn: declareRuntimeEnv('RESOLVE_ES_CLUSTER_ARN'),
      databaseName: declareRuntimeEnv('RESOLVE_ES_DATABASE'),
      tableName: declareRuntimeEnv('RESOLVE_ES_TABLE'),
      region: declareRuntimeEnv('AWS_REGION'),
      skipInit: true
    }
  },
  schedulers: {
    scheduler: {
      adapter: {
        module: 'resolve-scheduler-cloud',
        options: {}
      },
      connectorName: 'default'
    }
  },
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-mysql',
      options: {
        host: declareRuntimeEnv('RESOLVE_READMODEL_SQL_HOST'),
        database: declareRuntimeEnv('RESOLVE_READMODEL_SQL_DATABASE'),
        user: declareRuntimeEnv('RESOLVE_READMODEL_SQL_USER'),
        password: declareRuntimeEnv('RESOLVE_READMODEL_SQL_PASSWORD')
      }
    },
    hackerNews: {
      module: 'resolve-readmodel-mysql',
      options: {
        host: declareRuntimeEnv('RESOLVE_READMODEL_SQL_HOST'),
        database: declareRuntimeEnv('RESOLVE_READMODEL_SQL_DATABASE'),
        user: declareRuntimeEnv('RESOLVE_READMODEL_SQL_USER'),
        password: declareRuntimeEnv('RESOLVE_READMODEL_SQL_PASSWORD')
      }
    },
    comments: {
      module: 'resolve-readmodel-mysql',
      options: {
        host: declareRuntimeEnv('RESOLVE_READMODEL_SQL_HOST'),
        database: declareRuntimeEnv('RESOLVE_READMODEL_SQL_DATABASE'),
        user: declareRuntimeEnv('RESOLVE_READMODEL_SQL_USER'),
        password: declareRuntimeEnv('RESOLVE_READMODEL_SQL_PASSWORD')
      }
    },
    elasticSearch: {
      module: 'common/read-models/elastic-search-connector.js',
      options: {
        /*
        host: '<your-cloud-elastic-search-host>'
         */
      }
    }
  }
}
