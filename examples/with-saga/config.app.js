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
  sagas: [
    {
      name: 'userCreation',
      eventHandlers: 'common/sagas/user-creation.event.js',
      cronHandlers: 'common/sagas/user-creation.cron.js'
    }
  ],
  aggregates: [
    {
      name: 'user',
      commands: 'common/aggregates/user.commands.js',
      projection: 'common/aggregates/user.projection.js'
    }
  ],
  redux: {
    reducers: {
      user: 'client/reducers/user_optimistic.js'
    },
    middlewares: ['client/middlewares/user_create_middleware.js'],
    enhancers: ['client/enhancers/redux-devtools.js']
  }
}

export default appConfig
