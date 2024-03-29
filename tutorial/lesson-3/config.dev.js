import { declareRuntimeEnv } from '@resolve-js/scripts'
const devConfig = {
  mode: 'development',
  runtime: {
    module: '@resolve-js/runtime-single-process',
    options: {
      host: declareRuntimeEnv('HOST', 'localhost'),
      port: declareRuntimeEnv('PORT', '3000'),
    },
  },
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data/read-models.db',
      },
    },
  },
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: 'data/storage.db',
      secretsFile: 'data/secrets.db',
      snapshotBucketSize: 100,
    },
  },
  /*{
      module: '@resolve-js/eventstore-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'customUser',
        password: 'customPassword',
        database: 'customDatabaseName',
        eventsTableName: 'customTableName',
        secretsDatabase: 'customSecretsDatabaseName',
        secretsTableName: 'customSecretsTableName'
      }
    },*/
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
}
export default devConfig
