import { declareRuntimeEnv } from 'resolve-scripts'

const cloudConfig = {
  target: 'cloud',
  mode: 'production',
  staticPath: declareRuntimeEnv('RESOLVE_CLOUD_STATIC_URL'),
  subscribeAdapter: {
    module: 'resolve-subscribe-mqtt',
    options: {}
  },
  eventstoreAdapter: {
    module: 'resolve-eventstore-postgresql-serverless',
    options: {
      awsSecretStoreArn: declareRuntimeEnv('RESOLVE_ES_SECRET_STORE_ARN'),
      dbClusterOrInstanceArn: declareRuntimeEnv('RESOLVE_ES_CLUSTER_ARN'),
      databaseName: declareRuntimeEnv('RESOLVE_ES_DATABASE'),
      tableName: declareRuntimeEnv('RESOLVE_ES_TABLE'),
      region: declareRuntimeEnv('AWS_REGION'),
      secretsTableName: declareRuntimeEnv('RESOLVE_ES_SECRETS_TABLE')
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

export default cloudConfig
