const appConfig = {
  staticDir: 'static',
  distDir: 'dist',
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shopping-list.commands.ts',
      projection: 'common/aggregates/shopping-list.projection.ts',
    },
  ],
  viewModels: [
    {
      name: 'shoppingList',
      projection: 'common/view-models/shopping-list.projection.ts',
    },
  ],
  readModels: [
    {
      name: 'ShoppingLists',
      projection: 'common/read-models/shopping-lists.projection.ts',
      resolvers: 'common/read-models/shopping-lists.resolvers.ts',
      connectorName: 'default',
    },
  ],
  apiHandlers: [
    {
      path: '/api/shopping-lists.json',
      handler: 'common/api-handlers/shopping-lists.ts',
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
