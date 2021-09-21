import { declareRuntimeEnv } from '@resolve-js/scripts'
const devCommonConfig = {
  mode: 'development',
  runtime: {
    module: '@resolve-js/runtime-dev',
    options: {
      host: declareRuntimeEnv('HOST', 'localhost'),
      port: declareRuntimeEnv('PORT', '3000'),
      importMode: 'dynamic',
    },
  },
  readModelConnectors: {
    default: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data/read-model-default.db',
      },
    },
    hackerNews: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data/read-model-hackerNews.db',
      },
    },
    comments: {
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: 'data/read-model-comments.db',
      },
    },
    elasticSearch: {
      module: 'common/read-models/elastic-search-connector.ts',
      options: {
        /*
        node: "<your-cloud-elastic-search-host>:port",
        auth: {
          username: 'name',
          password: 'pass'
        }
        */
      },
    },
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
}

export default devCommonConfig
