import { declareRuntimeEnv } from '@resolve-js/scripts'

const devConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
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
          databaseName: 'event-store-dev-0.28.2-pxcxz3',
          // eventsTableName: iotsTypes.NonEmptyString,
          // secretsTableName: iotsTypes.NonEmptyString,
          // snapshotsTableName: iotsTypes.NonEmptyString,
          // subscribersTableName: iotsTypes.NonEmptyString,
          // region: 'region',
        },
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
        node: "<your-cloud-elastic-search-host>:port",
        auth: {
          username: 'name',
          password: 'pass'
        }
        */
      },
    },
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
}

export default devConfig
