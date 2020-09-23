const appConfig = {
  aggregates: [
    {
      name: 'user',
      commands: 'common/aggregates/user.commands.js',
      projection: 'common/aggregates/user.projection.js',
    },
  ],
  readModels: [
    {
      name: 'users',
      projection: 'common/read-models/users.projection.js',
      resolvers: 'common/read-models/users.resolvers.js',
      connectorName: 'default',
    },
  ],
  viewModels: [
    {
      name: 'user-profile',
      projection: 'common/view-models/user.projection.js',
      resolver: 'common/view-models/user.resolver.js',
    },
  ],
  apiHandlers: [
    {
      handler: 'resolve-runtime/lib/local/query-is-ready-handler.js',
      path: '/api/query-is-ready',
      method: 'GET',
    },
  ],
  clientEntries: ['client/index.js'],
}

export default appConfig
