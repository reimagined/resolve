const appConfig = {
  routes: '../web/lib/routes.js',
  staticDir: '../web/static',
  distDir: './dist',
  redux: {
    reducers: '../web/lib/redux/reducers/index.js',
    middlewares: '../web/lib/redux/middlewares/index.js',
    store: '../web/lib/redux/store/index.js'
  },
  aggregates: [
    {
      name: 'ShoppingList',
      commands: '../domain/lib/aggregates/shopping-list.commands.js',
      projection: '../domain/lib/aggregates/shopping-list.projection.js'
    },
    {
      name: 'User',
      commands: '../domain/lib/aggregates/user.commands.js',
      projection: '../domain/lib/aggregates/user.projection.js'
    }
  ],
  viewModels: [
    {
      name: 'ShoppingList',
      projection: '../domain/lib/view-models/shopping-list.projection.js'
    }
  ],
  readModels: [
    {
      name: 'ShoppingLists',
      projection: '../domain/lib/read-models/shopping-lists.projection.js',
      resolvers: '../domain/lib/read-models/shopping-lists.resolvers.js'
    }
  ],
  jwtCookie: {
    name: 'shopping-list-jwt',
    maxAge: 31536000000
  },
  auth: {
    strategies: '../domain/lib/auth/index.js'
  },
  subscribeAdapter: {
    module: 'resolve-subscribe-socket.io',
    options: {}
  }
}

module.exports = appConfig
