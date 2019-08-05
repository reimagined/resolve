const appConfig = {
  routes: 'client/routes.js',
  staticDir: 'static',
  distDir: 'dist',
  redux: {
    reducers: {
      optimisticShoppingLists: 'client/reducers/optimistic_shopping_lists.js'
    },
    sagas: ['client/sagas/optimistic_shopping_lists_saga.js']
  },
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shopping_list.commands.js',
      projection: 'common/aggregates/shopping_list.projection.js'
    }
  ],
  viewModels: [
    {
      name: 'shoppingList',
      projection: 'common/view-models/shopping_list.projection.js'
    }
  ],
  readModels: [
    {
      name: 'ShoppingLists',
      projection: 'common/read-models/shopping_lists.projection.js',
      resolvers: 'common/read-models/shopping_lists.resolvers.js',
      connectorName: 'default'
    }
  ],
  apiHandlers: [
    {
      path: 'shopping-lists.json',
      controller: 'common/api-handlers/shopping_lists.js',
      method: 'GET'
    }
  ]
}

export default appConfig
