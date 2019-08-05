const appConfig = {
  routes: 'client/routes.js',
  staticDir: 'static',
  distDir: 'dist',
  redux: {
    reducers: {
      optimisticSharings: 'client/redux/reducers/optimistic-sharings.js',
      optimisticShoppingLists:
        'client/redux/reducers/optimistic-shopping-lists.js'
    },
    sagas: [
      'client/redux/sagas/optimistic-sharings-saga.js',
      'client/redux/sagas/optimistic-shopping-lists-saga.js'
    ]
  },
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shopping-list.commands.js',
      projection: 'common/aggregates/shopping-list.projection.js'
    },
    {
      name: 'User',
      commands: 'common/aggregates/user.commands.js',
      projection: 'common/aggregates/user.projection.js'
    }
  ],
  viewModels: [
    {
      name: 'shoppingList',
      projection: 'common/view-models/shopping-list.projection.js'
    }
  ],
  readModels: [
    {
      name: 'ShoppingLists',
      projection: 'common/read-models/shopping-lists.projection.js',
      resolvers: 'common/read-models/shopping-lists.resolvers.js',
      connectorName: 'default'
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
