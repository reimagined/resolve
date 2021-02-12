import { declareRuntimeEnv } from '@reimagined/scripts'

const devConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  readModelConnectors: {
    default: {
      module: '@reimagined/readmodel-lite',
      options: {
        databaseFile: 'data/read-models.db',
      },
    },
    /*default: {
      module: '@reimagined/readmodel-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'customUser',
        password: 'customPassword',
        database: 'customDatabaseName'
      }
    }*/
  },
  eventstoreAdapter: {
    module: '@reimagined/eventstore-lite',
    options: {
      databaseFile: 'data/storage.db',
      secretsFile: 'data/secrets.db',
      snapshotBucketSize: 100,
    },
  },
  /*{
    module: '@reimagined/eventstore-mysql',
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
