import { declareRuntimeEnv } from '@resolve-js/scripts'
const dockerConfig = {
  mode: 'production',
  runtime: {
    module: '@resolve-js/runtime-single-process',
    options: {
      host: declareRuntimeEnv('HOST', 'localhost'),
      port: declareRuntimeEnv('PORT', '3000'),
    },
  },
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-postgresql',
    options: {
      databaseName: declareRuntimeEnv('RESOLVE_EVENT_STORE_DATABASE_NAME'),
      host: declareRuntimeEnv('RESOLVE_EVENT_STORE_CLUSTER_HOST'),
      port: declareRuntimeEnv('RESOLVE_EVENT_STORE_CLUSTER_PORT'),
      user: declareRuntimeEnv('RESOLVE_USER'),
      password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
      database: 'postgres',
    },
  },
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-postgresql',
      options: {
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        host: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_HOST'),
        port: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_PORT'),
        user: declareRuntimeEnv('RESOLVE_USER'),
        password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
        database: 'postgres',
      },
    },
    hackerNews: {
      module: '@resolve-js/readmodel-postgresql',
      options: {
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        host: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_HOST'),
        port: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_PORT'),
        user: declareRuntimeEnv('RESOLVE_USER'),
        password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
        database: 'postgres',
      },
    },
    comments: {
      module: '@resolve-js/readmodel-postgresql',
      options: {
        databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
        host: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_HOST'),
        port: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_PORT'),
        user: declareRuntimeEnv('RESOLVE_USER'),
        password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
        database: 'postgres',
      },
    },
    elasticSearch: {
      module: 'common/read-models/elastic-search-connector.js',
      options: {
        /*
            host: '<your-production-elastic-search-host>'
            */
      },
    },
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
}
export default dockerConfig
