import { declareRuntimeEnv } from 'resolve-scripts'

export default {
  target: 'cloud',
  mode: 'production',
  staticPath: declareRuntimeEnv('RESOLVE_CLOUD_STATIC_URL'),
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
  readModelConnectors: {
    users: {
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
    files: {
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
    }
  },
  uploadAdapter: {
    module: 'resolve-upload-cloud',
    options: {
      encryptedDeploymentId: declareRuntimeEnv(
        'RESOLVE_ENCRYPTED_DEPLOYMENT_ID'
      ),
      deploymentId: declareRuntimeEnv('RESOLVE_DEPLOYMENT_ID'),
      CDN: declareRuntimeEnv('RESOLVE_UPLOADER_URL'),
      uploaderArn: declareRuntimeEnv('RESOLVE_UPLOADER_LAMBDA_ARN')
    }
  }
}
