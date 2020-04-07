const appConfig = {
  aggregates: [
    {
      name: 'aggregate-name',
      commands: 'common/aggregates/user-profile.commands.ts',
      projection: 'common/aggregates/user-profile.projection.ts'
    }
  ],
  readModels: [
    {
      name: 'read-model-name',
      connectorName: 'default',
      projection: 'common/read-models/users.projection.ts',
      resolvers: 'common/read-models/users.resolvers.ts'
    }
  ],
  clientEntries: [
    [
      'client/index.tsx',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web'
      }
    ]
  ]
}

export default appConfig
