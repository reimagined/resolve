const devConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {
      pathToFile: 'event-storage.db'
    }
  },
  subscribeAdapter: {
    module: 'resolve-subscribe-socket.io',
    options: {}
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  },
  readModelAdapters: [
    {
      name: 'default',
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'read-models.db'
      }
    }
  ]
}

export default devConfig
