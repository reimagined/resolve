const appConfig = {
  routes: '../web/lib/routes.js',
  staticDir: '../web/static',
  distDir: './dist',
  redux: {
    reducers: {
      optimisticSharings: '../web/lib/redux/reducers/optimistic-sharings.js',
      optimisticShoppingLists: '../web/lib/redux/reducers/optimistic-shopping-lists.js'
    },
    middlewares: [
      '../web/lib/redux/middlewares/optimistic-sharings-middleware.js',
      '../web/lib/redux/middlewares/optimistic-shopping-lists-middleware.js'
    ],
    enhancers: [
      '../web/lib/redux/enhancers/redux-devtools.js'
    ]
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
  subscribeAdapter: {
    module: 'resolve-subscribe-socket.io',
    options: {}
  }
}

module.exports = appConfig
