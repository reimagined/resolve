import resolveModuleComments from 'resolve-module-comments'

const appConfig = {
  routes: 'client/routes.js',
  redux: {
    store: 'client/store/index.js',
    reducers: 'client/reducers/index.js',
    middlewares: 'client/middlewares/index.js'
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
  viewModels: [
    {
      name: 'CommentNotification',
      projection: 'common/view-models/comments-notification.projection.js'
    }
  ],
  readModels: [
    {
      name: 'HackerNews',
      projection: 'common/read-models/hacker-news.projection.js',
      resolvers: 'common/read-models/hacker-news.resolvers.js'
    }
  ],
  auth: {
    strategies: 'auth/local_strategy.js'
  }
}

const moduleComments = resolveModuleComments({
  aggregateName: 'HackerNewsComments'
})

for (const key of Object.keys(moduleComments)) {
  if (Array.isArray(moduleComments[key])) {
    appConfig[key] = appConfig[key].concat(moduleComments[key])
  }
}

export default appConfig
