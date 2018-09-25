const appConfig = {
  routes: 'web/routes.js',
  staticDir: 'web/static',
  distDir: 'web/dist',
  redux: {
    reducers: 'web/redux/reducers/index.js',
    middlewares: 'web/redux/middlewares/index.js',
    store: 'web/redux/store/index.js'
  },
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'domain/aggregates/shopping_list.commands.js',
      projection: 'domain/aggregates/shopping_list.projection.js'
    },
    {
      name: 'User',
      commands: 'domain/aggregates/user.commands.js',
      projection: 'domain/aggregates/user.projection.js'
    }
  ],
  viewModels: [
    {
      name: 'ShoppingList',
      projection: 'domain/view-models/shopping_list.projection.js'
    }
  ],
  readModels: [
    {
      name: 'ShoppingLists',
      projection: 'domain/read-models/shopping_lists.projection.js',
      resolvers: 'domain/read-models/shopping_lists.resolvers.js'
    }
  ],
  jwtCookie: {
    name: 'shopping-list-jwt',
    maxAge: 31536000000
  },
  auth: {
    strategies: 'domain/auth/index.js'
  },
  subscribeAdapter: {
    module: 'resolve-subscribe-socket.io',
    options: {}
  }
}

export default appConfig
