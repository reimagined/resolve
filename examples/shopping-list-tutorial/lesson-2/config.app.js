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
  viewModels: []
}

export default appConfig
