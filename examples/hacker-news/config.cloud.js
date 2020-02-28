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
        dbClusterOrInstanceArn: declareRuntimeEnv(
          'RESOLVE_READMODEL_POSTGRESQL_CLUSTER_ARN'
        ),
        awsSecretStoreArn: declareRuntimeEnv(
          'RESOLVE_READMODEL_POSTGRESQL_SECRET_ARN'
        ),
        databaseName: declareRuntimeEnv(
          'RESOLVE_READMODEL_POSTGRESQL_DATABASE_NAME'
        ),
        region: declareRuntimeEnv('AWS_REGION')
      }
    },
    hackerNews: {
      module: 'resolve-readmodel-postgresql-serverless',
      options: {
        dbClusterOrInstanceArn: declareRuntimeEnv(
          'RESOLVE_READMODEL_POSTGRESQL_CLUSTER_ARN'
        ),
        awsSecretStoreArn: declareRuntimeEnv(
          'RESOLVE_READMODEL_POSTGRESQL_SECRET_ARN'
        ),
        databaseName: declareRuntimeEnv(
          'RESOLVE_READMODEL_POSTGRESQL_DATABASE_NAME'
        ),
        region: declareRuntimeEnv('AWS_REGION')
      }
    },
    comments: {
      module: 'resolve-readmodel-postgresql-serverless',
      options: {
        dbClusterOrInstanceArn: declareRuntimeEnv(
          'RESOLVE_READMODEL_POSTGRESQL_CLUSTER_ARN'
        ),
        awsSecretStoreArn: declareRuntimeEnv(
          'RESOLVE_READMODEL_POSTGRESQL_SECRET_ARN'
        ),
        databaseName: declareRuntimeEnv(
          'RESOLVE_READMODEL_POSTGRESQL_DATABASE_NAME'
        ),
        region: declareRuntimeEnv('AWS_REGION')
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
  }
}
