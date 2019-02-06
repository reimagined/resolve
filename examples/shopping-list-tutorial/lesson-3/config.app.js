const appConfig = {
  routes: 'client/routes.js',
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
      name: 'ShoppingList',
      projection: 'common/view-models/shopping_list.projection.js'
    }
  ]
}

export default appConfig
