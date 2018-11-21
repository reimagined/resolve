import { declareRuntimeEnv } from 'resolve-scripts'

export default {
  target: 'cloud',
  mode: 'production',
  staticPath: declareRuntimeEnv('CLOUD_STATIC_URL'),
  subscribeAdapter: {
    module: 'resolve-subscribe-mqtt',
    options: {}
  },
  storageAdapter: {
    module: 'resolve-storage-dynamo',
    options: {
      tableName: declareRuntimeEnv('DYNAMODB_TABLE_NAME'),
      skipInit: true
    }
  },
  readModelAdapters: [
    {
      name: 'default',
      module: 'resolve-readmodel-mysql',
      options: {
        host: declareRuntimeEnv('SQL_HOST'),
        database: declareRuntimeEnv('SQL_DATABASE'),
        user: declareRuntimeEnv('SQL_USER'),
        password: declareRuntimeEnv('SQL_PASSWORD')
      }
    }
  ]
}
