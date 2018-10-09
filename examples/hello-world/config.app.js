const appConfig = {
  routes: 'client/routes.js',
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
      adapter: {
        module: 'resolve-readmodel-memory',
        options: {}
      }
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
  sagas: [
    {
      name: 'saga-name',
      cronHandlers: 'common/sagas/saga-name.cron.js',
      eventHandlers: 'common/sagas/saga-name.event.js'
    }
  ],
  auth: {
    strategies: 'auth/index.js'
  },
  redux: {
    reducers: { 'reducer-name': 'client/reducers/reducer-name.js' },
    middlewares: ['client/middlewares/middleware-name.js']
  }
}

export default appConfig
