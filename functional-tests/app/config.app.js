const appConfig = {
  aggregates: [
    {
      name: 'user',
      commands: 'common/aggregates/user.commands.js',
      projection: 'common/aggregates/user.projection.js'
    }
  ],
  readModels: [
    {
      name: 'users',
      projection: 'common/read-models/users.projection.js',
      resolvers: 'common/read-models/users.resolvers.js',
      connectorName: 'default'
    }
  ],
  viewModels: [
    {
      name: 'user',
      projection: 'common/view-models/user.projection.js',
      resolver: 'common/view-models/user.resolver.js'
    }
  ],
  clientEntries: ['client/index.js']
}

export default appConfig
