import { declareRuntimeEnv } from 'resolve-scripts'

export default {
  target: 'cloud',
  mode: 'production',
  staticPath: declareRuntimeEnv('RESOLVE_CLOUD_STATIC_URL'),
  eventstoreAdapter: {
    module: 'resolve-eventstore-postgresql-serverless',
    options: {
      awsSecretStoreArn: declareRuntimeEnv('USER_SECRET_ARN'),
      dbClusterOrInstanceArn: declareRuntimeEnv('EVENT_STORE_CLUSTER_ARN'),
      databaseName: declareRuntimeEnv('EVENT_STORE_DATABASE_NAME'),
      eventsTableName: 'events',
      secretsTableName: 'secrets',
      region: declareRuntimeEnv('AWS_REGION'),
      snapshotBucketSize: 100,
    },
  },
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-postgresql-serverless',
      options: {
        dbClusterOrInstanceArn: declareRuntimeEnv('READMODEL_CLUSTER_ARN'),
        awsSecretStoreArn: declareRuntimeEnv('USER_SECRET_ARN'),
        databaseName: declareRuntimeEnv('READMODEL_DATABASE_NAME'),
        region: declareRuntimeEnv('AWS_REGION'),
      },
    },
    hackerNews: {
      module: 'resolve-readmodel-postgresql-serverless',
      options: {
        dbClusterOrInstanceArn: declareRuntimeEnv('READMODEL_CLUSTER_ARN'),
        awsSecretStoreArn: declareRuntimeEnv('USER_SECRET_ARN'),
        databaseName: declareRuntimeEnv('READMODEL_DATABASE_NAME'),
        region: declareRuntimeEnv('AWS_REGION'),
      },
    },
    comments: {
      module: 'resolve-readmodel-postgresql-serverless',
      options: {
        dbClusterOrInstanceArn: declareRuntimeEnv('READMODEL_CLUSTER_ARN'),
        awsSecretStoreArn: declareRuntimeEnv('USER_SECRET_ARN'),
        databaseName: declareRuntimeEnv('READMODEL_DATABASE_NAME'),
        region: declareRuntimeEnv('AWS_REGION'),
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
}
