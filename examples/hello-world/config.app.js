const appConfig = {
  aggregates: [
    {
      name: 'aggregate-name',
      commands: 'common/aggregates/aggregate-name.commands.js',
      projection: 'common/aggregates/aggregate-name.projection.js'
    }
  ],
  readModels: [
    {
      name: 'read-model-name',
      projection: 'common/read-models/read-model-name.projection.js',
      resolvers: 'common/read-models/read-model-name.resolvers.js',
      connectorName: 'default'
    }
  ],
  viewModels: [
    {
      name: 'view-model-name',
      projection: 'common/view-models/view-model-name.projection.js',
      serializeState: 'common/view-models/view-model-name.serialize_state.js',
      deserializeState:
        'common/view-models/view-model-name.deserialize_state.js'
    }
  ],
  clientEntries: ['client/index.js']
}

export default appConfig
