const appConfig = {
  aggregates: [
    {
      name: 'Entity',
      commands: 'common/aggregates/entity.commands.ts',
      projection: 'common/aggregates/entity.projection.ts',
    },
  ],
  readModels: [
    {
      name: 'Entities',
      connectorName: 'default',
      projection: 'common/read-models/entities.projection.ts',
      resolvers: 'common/read-models/entities.resolvers.ts',
    },
  ],
  viewModels: [
    {
      name: 'EntityDetails',
      projection: 'common/view-models/entityDetails.projection.ts',
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
