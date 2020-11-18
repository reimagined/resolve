const appConfig = {
  staticDir: 'static',
  distDir: 'dist',
  aggregates: [
    {
      name: 'ShoppingList',
      commands: 'common/aggregates/shopping-list.commands.js',
      projection: 'common/aggregates/shopping-list.projection.js',
    },
    {
      name: 'User',
      commands: 'common/aggregates/user.commands.js',
      projection: 'common/aggregates/user.projection.js',
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
  jwtCookie: {
    name: 'shopping-list-jwt',
    maxAge: 31536000000,
  },
  clientEntries: ['client/index.js'],
}

module.exports = appConfig
