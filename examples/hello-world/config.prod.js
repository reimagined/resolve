const prodConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'production',
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'read-models.db'
      }
    }
    /*
      default: {
        module: 'resolve-readmodel-mongo',
        options: {
          url: 'mongodb://127.0.0.1:27017/MyDatabaseName',
        }
      }
    */
    /*
      default: {
        module: 'resolve-readmodel-mysql',
        options: {
          host: 'localhost',
          port: 3306,
          user: 'customUser',
          password: 'customPassword',
          database: 'customDatabaseName'
        }
      }
    */
  },
  snapshotAdapter: {
    module: 'resolve-snapshot-lite',
    options: {
      // pathToFile: 'path/to/file',
      bucketSize: 100
    }
  },
  /*
    {
      module: 'resolve-snapshot-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'customUser',
        password: 'customPassword',
        database: 'customDatabaseName',
        tableName: 'customTableName',
        bucketSize: 100
      }
    }
  */ storageAdapter: {
    module: 'resolve-storage-lite',
    options: {
      pathToFile: 'event-storage.db'
    }
  },
  /*
    {
      module: 'resolve-storage-mongo',
      options: {
        url: 'mongodb://127.0.0.1:27017/MyDatabaseName',
        collectionName: 'Events'
      }
    }
  */
  /*
    {
      module: 'resolve-storage-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'customUser',
        password: 'customPassword',
        database: 'customDatabaseName',
        tableName: 'customTableName'
      }
    }
  */ subscribeAdapter: {
    module: 'resolve-subscribe-socket.io',
    options: {}
  },
  /*
    {
      module: 'resolve-subscribe-mqtt',
      options: {}
    }
  */ jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  }
}

export default prodConfig
