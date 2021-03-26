import { declareRuntimeEnv } from '@resolve-js/scripts'

export default {
  target: 'cloud',
  mode: 'production',
  staticPath: declareRuntimeEnv('RESOLVE_CLOUD_STATIC_URL'),
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-postgresql-serverless',
    options: {
      awsSecretStoreArn: declareRuntimeEnv('RESOLVE_USER_SECRET_ARN'),
      dbClusterOrInstanceArn: declareRuntimeEnv(
        'RESOLVE_EVENT_STORE_CLUSTER_ARN'
      ),
      databaseName: declareRuntimeEnv('RESOLVE_EVENT_STORE_DATABASE_NAME'),
      eventsTableName: 'events',
      secretsTableName: 'secrets',
      region: declareRuntimeEnv('AWS_REGION'),
      snapshotBucketSize: 100,
    },
  },
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-postgresql-serverless',
      options: {
        dbClusterOrInstanceArn: declareRuntimeEnv(
          'RESOLVE_READMODEL_CLUSTER_ARN'
        ),
        awsSecretStoreArn: declareRuntimeEnv('RESOLVE_USER_SECRET_ARN'),
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        region: declareRuntimeEnv('AWS_REGION'),
      },
    },
    replicator: {
      module: './readmodel-replicator-postgresql-serverless/lib/index.js',
      options: {
        dbClusterOrInstanceArn: declareRuntimeEnv(
          'RESOLVE_READMODEL_CLUSTER_ARN'
        ),
        awsSecretStoreArn: declareRuntimeEnv('RESOLVE_USER_SECRET_ARN'),
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        region: declareRuntimeEnv('AWS_REGION'),
        targetEventStore: {
          dbClusterOrInstanceArn: declareRuntimeEnv(
            'RESOLVE_READMODEL_CLUSTER_ARN'
          ),
          awsSecretStoreArn: declareRuntimeEnv('RESOLVE_USER_SECRET_ARN'),
          databaseName: 'event-store-dev-0.28.2-u1yzmk',
          // eventsTableName: iotsTypes.NonEmptyString,
          // secretsTableName: iotsTypes.NonEmptyString,
          // snapshotsTableName: iotsTypes.NonEmptyString,
          // subscribersTableName: iotsTypes.NonEmptyString,
          // region: 'region',
        },
      },
    },
    hackerNews: {
      module: '@resolve-js/readmodel-postgresql-serverless',
      options: {
        dbClusterOrInstanceArn: declareRuntimeEnv(
          'RESOLVE_READMODEL_CLUSTER_ARN'
        ),
        awsSecretStoreArn: declareRuntimeEnv('RESOLVE_USER_SECRET_ARN'),
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        region: declareRuntimeEnv('AWS_REGION'),
      },
    },
    comments: {
      module: '@resolve-js/readmodel-postgresql-serverless',
      options: {
        dbClusterOrInstanceArn: declareRuntimeEnv(
          'RESOLVE_READMODEL_CLUSTER_ARN'
        ),
        awsSecretStoreArn: declareRuntimeEnv('RESOLVE_USER_SECRET_ARN'),
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
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
