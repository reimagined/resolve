const appConfig = {
  routes: 'client/routes.js',
  redux: {
    reducers: {
      optimistic: 'client/reducers/optimistic.js'
    },
    middlewares: [
      'client/middlewares/story-create-middleware.js',
      'client/middlewares/optimistic-voting-middleware.js'
    ]
  },
  aggregates: [
    {
      name: 'Story',
      commands: 'common/aggregates/story.commands.js',
      projection: 'common/aggregates/story.projection.js'
    },
    {
      name: 'User',
      commands: 'common/aggregates/user.commands.js',
      projection: 'common/aggregates/user.projection.js'
    }
  ],
  readModels: [
    {
      name: 'HackerNews',
      projection: 'common/read-models/hacker-news.projection.js',
      resolvers: 'common/read-models/hacker-news.resolvers.js',
      adapterName: 'default'
    }
  ],
  customReadModels: [
    {
      name: 'CustomReadModel',
      updateByEvents: 'common/custom-read-models/custom.update-by-events.js',
      read: 'common/custom-read-models/custom.read.js'
    }
  ]
}

export default appConfig
