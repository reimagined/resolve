export default {
  port: 3000,
  polyfills: ['@babel/runtime/regenerator'],
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  routes: 'client/routes.js',
  aggregates: [],
  readModels: [],
  viewModels: [],
  sagas: [],
  apiHandlers: [],
  index: 'client/index.js',
  auth: {
    strategies: 'auth/index.js'
  },
  redux: {
    store: 'client/store/index.js',
    reducers: 'client/reducers/index.js',
    middlewares: 'client/middlewares/index.js'
  },
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
  },
  customConstants: {}
}
