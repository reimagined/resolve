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
      region: declareRuntimeEnv('AWS_REGION')
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
      module: 'resolve-readmodel-postgresql-serverless',
      options: {
        awsSecretStoreArn: declareRuntimeEnv('RESOLVE_ES_SECRET_STORE_ARN'),
        dbClusterOrInstanceArn: declareRuntimeEnv('RESOLVE_ES_CLUSTER_ARN'),
        databaseName: declareRuntimeEnv('RESOLVE_ES_DATABASE'),
        region: declareRuntimeEnv('AWS_REGION'),
        tablePrefix: 'DEFAULT_'
      }
    },
    hackerNews: {
      module: 'resolve-readmodel-postgresql-serverless',
      options: {
        awsSecretStoreArn: declareRuntimeEnv('RESOLVE_ES_SECRET_STORE_ARN'),
        dbClusterOrInstanceArn: declareRuntimeEnv('RESOLVE_ES_CLUSTER_ARN'),
        databaseName: declareRuntimeEnv('RESOLVE_ES_DATABASE'),
        region: declareRuntimeEnv('AWS_REGION'),
        tablePrefix: 'HACKERNEWS_'
      }
    },
    comments: {
      module: 'resolve-readmodel-postgresql-serverless',
      options: {
        awsSecretStoreArn: declareRuntimeEnv('RESOLVE_ES_SECRET_STORE_ARN'),
        dbClusterOrInstanceArn: declareRuntimeEnv('RESOLVE_ES_CLUSTER_ARN'),
        databaseName: declareRuntimeEnv('RESOLVE_ES_DATABASE'),
        region: declareRuntimeEnv('AWS_REGION'),
        tablePrefix: 'COMMENTS_'
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
