const appConfig = {
  aggregates: [
    {
      name: 'aggregate-name',
      commands: 'common/aggregates/aggregate-name.commands.ts',
      projection: 'common/aggregates/aggregate-name.projection.ts',
    },
  ],
  readModels: [
    {
      name: 'read-model-name',
      connectorName: 'default',
      projection: 'common/read-models/read-model-name.projection.ts',
      resolvers: 'common/read-models/read-model-name.resolvers.ts',
    },
  ],
  viewModels: [
    {
      name: 'view-model-name',
      projection: 'common/view-models/view-model-name.projection.ts',
      serializeState: 'common/view-models/view-model-name.serialize_state.ts',
      deserializeState:
        'common/view-models/view-model-name.deserialize_state.ts',
    },
  ],
  sagas: [
    {
      name: 'saga-name',
      source: 'common/sagas/saga-name.ts',
      connectorName: 'default',
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
