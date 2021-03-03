import { declareRuntimeEnv } from '@resolve-js/scripts'

const cloudConfig = {
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
  },
  uploadAdapter: {
    options: {
      encryptedDeploymentId: declareRuntimeEnv(
        'RESOLVE_ENCRYPTED_DEPLOYMENT_ID'
      ),
      deploymentId: declareRuntimeEnv('RESOLVE_DEPLOYMENT_ID'),
      CDN: declareRuntimeEnv('RESOLVE_UPLOADER_URL'),
      uploaderArn: declareRuntimeEnv('RESOLVE_UPLOADER_LAMBDA_ARN'),
    },
  },
}

export default cloudConfig
