const appConfig = {
  aggregates: [
    {
      name: 'user',
      commands: 'common/aggregates/user.commands.js',
      projection: 'common/aggregates/user.projection.js',
      encryption: 'common/aggregates/encryption.js',
    },
  ],
  readModels: [
    {
      name: 'users',
      projection: 'common/read-models/users.projection.js',
      resolvers: 'common/read-models/users.resolvers.js',
      connectorName: 'default',
    },
    {
      name: 'personal-data',
      projection: 'common/read-models/personal-data.projection.js',
      resolvers: 'common/read-models/personal-data.resolvers.js',
      connectorName: 'default',
      encryption: 'common/read-models/encryption.js',
    },
  ],
  viewModels: [
    {
      name: 'user-profile',
      projection: 'common/view-models/user.projection.js',
      resolver: 'common/view-models/user.resolver.js',
    },
    {
      name: 'custom-serializer',
      projection: 'common/view-models/custom-serializer.projection.js',
      serializeState: 'common/view-models/custom-serializer.serialize.js',
      deserializeState: 'common/view-models/custom-serializer.deserialize.js',
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
