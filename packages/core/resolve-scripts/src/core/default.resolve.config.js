export default {
  port: 3000,
  polyfills: [],
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
    reducers: {},
    middlewares: [],
    sagas: [],
    enhancers: []
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
  readModelAdapters: {},
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  },
  customConstants: {}
}
