const appConfig = {
  aggregates: [
    {
      name: 'MyAggregate',
      commands: 'common/aggregates/my-aggregate.commands.js',
      projection: 'common/aggregates/my-aggregate.projection.js',
    },
  ],
  readModels: [
    {
      name: 'MyAggregateList',
      connectorName: 'default',
      projection: 'common/read-models/my-aggregate-list.projection.js',
      resolvers: 'common/read-models/my-aggregate-list.resolvers.js',
    },
  ],
  viewModels: [
    {
      name: 'MyAggregateItems',
      projection: 'common/view-models/my-aggregate-items.projection.js',
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
