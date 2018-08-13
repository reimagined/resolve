const prodConfig = {
  port: 3000,
  polyfills: ['@babel/runtime/regenerator'],
  mode: 'production',
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
  busAdapter: {
    module: 'resolve-bus-memory',
    options: {}
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

export default prodConfig
