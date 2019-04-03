const prodConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'production',
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'read-models.db'
      }
    },
    elasticSearch: {
      module: 'common/read-models/elastic-search-connector.js',
      options: {
        /*
        host: '<your-production-elastic-search-host>'
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
    databaseFile: "local-bus-broker.db"
  }
}

export default prodConfig
