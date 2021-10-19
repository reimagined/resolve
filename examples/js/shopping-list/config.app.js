const appConfig = {
  staticDir: 'static',
  distDir: 'dist',
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shopping-list.commands.js',
      projection: 'common/aggregates/shopping-list.projection.js',
    },
  ],
  viewModels: [
    {
      name: 'shoppingList',
      projection: 'common/view-models/shopping-list.projection.js',
    },
  ],
  readModels: [
    {
      name: 'ShoppingLists',
      projection: 'common/read-models/shopping-lists.projection.js',
      resolvers: 'common/read-models/shopping-lists.resolvers.js',
      connectorName: 'default',
    },
  ],
  apiHandlers: [
    {
      path: '/api/shopping-lists.json',
      handler: 'common/api-handlers/shopping-lists.js',
      method: 'GET',
    },
  ],
  clientEntries: [
    [
      'client/index.js',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web',
      },
    ],
  ],
}
export default appConfig
