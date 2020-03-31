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
      projection: 'common/read-models/read-model-name.projection.ts',
      resolvers: 'common/read-models/read-model-name.resolvers.ts'
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
