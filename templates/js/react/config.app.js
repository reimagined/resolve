const appConfig = {
  aggregates: [
    {
      name: 'Entity',
      commands: 'common/aggregates/entity.commands.js',
      projection: 'common/aggregates/entity.projection.js',
    },
  ],
  readModels: [
    {
      name: 'Entities',
      connectorName: 'default',
      projection: 'common/read-models/entities.projection.js',
      resolvers: 'common/read-models/entities.resolvers.js',
    },
  ],
  viewModels: [
    {
      name: 'EntityItems',
      projection: 'common/view-models/entityItems.projection.js',
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
