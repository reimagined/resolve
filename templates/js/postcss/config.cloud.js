import { declareRuntimeEnv } from '@resolve-js/scripts'
const configCloud = {
  mode: 'production',
  runtime: {
    module: '@resolve-js/runtime-aws-serverless',
    options: { importMode: 'dynamic' },
  },
  staticPath: declareRuntimeEnv('RESOLVE_CLOUD_STATIC_URL'),
  /*,
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
      }
    }*/
}
export default configCloud
