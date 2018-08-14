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
  sagas: [
    {
      name: 'rating',
      cronHandlers: 'common/sagas/rating.cron.js'
    }
  ]
}

export default appConfig
