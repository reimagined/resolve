const appConfig = {
  aggregates: [
    {
      name: 'aggregate-name',
      commands: 'build/common/aggregates/aggregate-name.commands.js',
      projection: 'build/common/aggregates/aggregate-name.projection.js'
    }
  ],
  readModels: [
    {
      name: 'read-model-name',
      connectorName: 'default',
      projection: 'build/common/read-models/read-model-name.projection.js',
      resolvers: 'build/common/read-models/read-model-name.resolvers.js'
    }
  ],
  viewModels: [
    {
      name: 'view-model-name',
      projection: 'build/common/view-models/view-model-name.projection.js',
      serializeState: 'build/common/view-models/view-model-name.serialize_state.js',
      deserializeState:
        'build/common/view-models/view-model-name.deserialize_state.js'
    }
  ],
  sagas: [
    {
      name: 'saga-name',
      source: 'build/common/sagas/saga-name.js',
      connectorName: 'default',
      schedulerName: 'scheduler'
    }
  ],
  clientEntries: ['build/client/index.js']
}

export default appConfig
