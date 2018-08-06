const appConfig = {
  routes: 'client/routes.js',
  readModels: [
    {
      name: 'default',
      projection: 'common/read-models/default.projection.js',
      resolvers: 'common/read-models/default.resolvers.js'
    }
  ],
  viewModels: [
    {
      name: 'error',
      projection: 'common/view-models/error.projection.js'
    }
  ],
  sagas: 'common/sagas/index.js',
  aggregates: [
    {
      name: 'user',
      commands: 'common/aggregates/user.commands.js',
      projection: 'common/aggregates/user.projection.js'
    }
  ],
  redux: {
    store: 'client/store/index.js',
    reducers: 'client/reducers/index.js',
    middlewares: 'client/middlewares/index.js'
  }
}

export default appConfig
