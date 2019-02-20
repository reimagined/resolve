const testFunctionalConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',

  readModelAdapters: [
    {
      name: 'default',
      module: 'resolve-readmodel-lite',
      options: {}
    }
  ],
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
  }
}

export default testFunctionalConfig
