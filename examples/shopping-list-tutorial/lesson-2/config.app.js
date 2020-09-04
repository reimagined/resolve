const appConfig = {
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shopping_list.commands.js',
      projection: 'common/aggregates/shopping_list.projection.js',
    },
  ],
  readModels: [],
  viewModels: [],
  clientEntries: ['client/index.js'],
}

export default appConfig
