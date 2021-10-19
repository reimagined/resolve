const appConfig = {
  aggregates: [
    {
      name: 'MyAggregate',
      commands: 'common/aggregates/my-aggregate.commands.ts',
      projection: 'common/aggregates/my-aggregate.projection.ts',
    },
  ],
  readModels: [
    {
      name: 'MyAggregateList',
      connectorName: 'default',
      projection: 'common/read-models/my-aggregate-list.projection.ts',
      resolvers: 'common/read-models/my-aggregate-list.resolvers.ts',
    },
  ],
  viewModels: [
    {
      name: 'MyAggregateItems',
      projection: 'common/view-models/my-aggregate-items.projection.ts',
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
