const appConfig = {
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shopping_list.commands.js',
      projection: 'common/aggregates/shopping_list.projection.js',
    },
  ],
  readModels: [
    {
      name: 'ShoppingLists',
      projection: 'common/read-models/shopping_lists.projection.js',
      resolvers: 'common/read-models/shopping_lists.resolvers.js',
      connectorName: 'default',
    },
  ],
  viewModels: [
    {
      name: 'shoppingList',
      projection: 'common/view-models/shopping_list.projection.js',
    },
  ],
  clientEntries: ['client/index.js'],
}
export default appConfig
