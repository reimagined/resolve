const appConfig = {
  routes: 'client/routes.js',
  aggregates: [
    {
      name: 'Rating',
      commands: 'common/aggregates/rating.commands.js'
    }
  ],
  readModels: [
    {
      name: 'Rating',
      projection: 'common/read-models/rating.projection.js',
      resolvers: 'common/read-models/rating.resolvers.js'
    }
  ],
  sagas: 'common/sagas/index.js'
}

export default appConfig
