const appConfig = {
  staticDir: 'static',
  distDir: 'dist',
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shopping_list.commands.ts',
      projection: 'common/aggregates/shopping_list.projection.ts',
    },
  ],
  viewModels: [
    {
      name: 'shoppingList',
      projection: 'common/view-models/shopping_list.projection.ts',
    },
  ],
  readModels: [
    {
      name: 'ShoppingLists',
      projection: 'common/read-models/shopping_lists.projection.ts',
      resolvers: 'common/read-models/shopping_lists.resolvers.ts',
      connectorName: 'default',
    },
  ],
  apiHandlers: [
    {
      path: '/api/shopping-lists.json',
      handler: 'common/api-handlers/shopping_lists.ts',
      method: 'GET',
    },
  ],
  clientEntries: [
    [
      'client/index.tsx',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web',
      },
    ],
  ],
}

export default appConfig
