const appConfig = {
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shopping_list.commands.js',
      projection: 'common/aggregates/shopping_list.projection.js',
    },
  ],
  readModels: [],
  viewModels: [
    {
      name: 'shoppingList',
      projection: 'common/view-models/shopping_list.projection.js',
    },
  ],
  clientEntries: ['client/index.js'],
}

export default appConfig
