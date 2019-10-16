const appConfig = {
  routes: 'client/routes.js',
  redux: {},
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shopping_list.commands.js',
      projection: 'common/aggregates/shopping_list.projection.js'
    }
  ],
  readModels: [],
  viewModels: [
    {
      name: 'shoppingList',
      projection: 'common/view-models/shopping_list.projection.js'
    }
  ]
}

export default appConfig
