const appConfig = {
  routes: 'client/routes.js',
  staticDir: 'static',
  distDir: 'dist',
  redux: {
    reducers: 'client/reducers/index.js',
    middlewares: 'client/middlewares/index.js',
    store: 'client/store/index.js'
  },
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shoppingList.commands.js',
      projection: 'common/aggregates/shoppingList.projection.js'
    }
  ],
  viewModels: [
    {
      name: 'ShoppingList',
      projection: 'common/view-models/shoppingList.projection.js'
    }
  ],
  readModels: [
    {
      name: 'Default',
      projection: 'common/read-models/default.projection.js',
      resolvers: 'common/read-models/default.resolvers.js'
    }
  ],
  jwtCookie: {
    name: 'shopping-list-jwt',
    maxAge: 31536000000
  },
  auth: {
    strategies: 'common/auth/index.js'
  },
  subscribeAdapter: {
    module: 'resolve-subscribe-socket.io',
    options: {}
  }
}

export default appConfig
