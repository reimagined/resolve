import { declareRuntimeEnv } from 'resolve-scripts'

export default {
  target: 'cloud',
  mode: 'production',
  staticPath: declareRuntimeEnv('RESOLVE_CLOUD_STATIC_URL'),
  eventstoreAdapter: {
    module: 'resolve-eventstore-postgresql-serverless',
    options: {
      awsSecretStoreArn: declareRuntimeEnv('RESOLVE_ES_SECRET_ARN'),
      dbClusterOrInstanceArn: declareRuntimeEnv('RESOLVE_ES_CLUSTER_ARN'),
      databaseName: declareRuntimeEnv('RESOLVE_ES_DATABASE'),
      eventsTableName: declareRuntimeEnv('RESOLVE_ES_EVENTS_TABLE'),
      secretsTableName: declareRuntimeEnv('RESOLVE_ES_SECRETS_TABLE'),
      region: declareRuntimeEnv('AWS_REGION'),
      snapshotBucketSize: 100,
    },
  },
}
