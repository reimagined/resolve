import { declareRuntimeEnv } from '@resolve-js/scripts'

const cloudConfig = {
  target: 'cloud',
  mode: 'production',
  staticPath: declareRuntimeEnv('RESOLVE_CLOUD_STATIC_URL'),
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-postgresql',
    options: {
      databaseName: declareRuntimeEnv('RESOLVE_EVENT_STORE_DATABASE_NAME'),
      host: declareRuntimeEnv('RESOLVE_EVENT_STORE_CLUSTER_HOST'),
      port: declareRuntimeEnv('RESOLVE_EVENT_STORE_CLUSTER_PORT'),
      user: declareRuntimeEnv('RESOLVE_USER_ID'),
      password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
      database: 'postgres',
      eventsTableName: 'events',
      secretsTableName: 'secrets',
      snapshotBucketSize: 100,
    },
  },
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-postgresql',
      options: {
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        host: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_HOST'),
        port: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_PORT'),
        user: declareRuntimeEnv('RESOLVE_USER_ID'),
        password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
        database: 'postgres',
      },
    },
  },
  uploadAdapter: {
    options: {
      encryptedUserId: declareRuntimeEnv('RESOLVE_ENCRYPTED_USER_ID'),
      userId: declareRuntimeEnv('RESOLVE_USER_ID'),
      CDN: declareRuntimeEnv('RESOLVE_UPLOADER_URL'),
      uploaderArn: declareRuntimeEnv('RESOLVE_UPLOADER_LAMBDA_ARN'),
      scope: 'functional-tests',
    },
  },
}

export default cloudConfig
