const appConfig = {
  routes: 'client/routes.js',
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shopping_list.commands.js',
      projection: 'common/aggregates/shopping_list.projection.js'
    }
  ],
  readModels: [
    {
      name: 'ShoppingLists',
      projection: 'common/read-models/shopping_lists.projection.js',
      resolvers: 'common/read-models/shopping_lists.resolvers.js',
      adapterName: 'default'
    }
  ],
  viewModels: [
    {
      name: 'ShoppingList',
      projection: 'common/view-models/shopping_list.projection.js'
    }
  ],
  redux: {
    reducers: {
      optimisticShoppingLists: 'client/reducers/optimistic_shopping_lists.js'
    },
    middlewares: ['client/middlewares/optimistic_shopping_lists_middleware.js']
  }
}

export default appConfig
