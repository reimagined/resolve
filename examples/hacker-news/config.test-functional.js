const testFunctionalConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'read-models-test-functional.db'
      }
    }
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  },
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {
      databaseFile: 'event-store-test-functional.db'
    }
  }
}

export default testFunctionalConfig
