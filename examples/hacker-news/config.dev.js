const devConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  redux: {
    enhancers: ['client/enhancers/redux-devtools.js']
  },
  storageAdapter: {
    module: 'resolve-storage-mysql',
    options: {
      tableName: '__TABLE_NAME__',
      host: 'localhost',
      port: 3306,
      user: 'qqq',
      password: 'qqq',
      database: 'qqq'
    }
  },
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'qqq',
        password: 'qqq',
        database: 'qqq'
      }
    },
    elasticSearch: {
      module: 'common/read-models/elastic-search-connector.js',
      options: {
        /*
        host: 'localhost:9200'
        */
      }
    }
  },
  schedulers: {
    scheduler: {
      adapter: {
        module: 'resolve-scheduler-local',
        options: {}
      },
      connectorName: 'default'
    }
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  },
  eventBroker: {
    databaseFile: 'local-bus-broker.db'
  }
}

export default devConfig
