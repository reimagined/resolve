const appConfig = {
  routes: 'client/routes.js',
  redux: {
    store: 'client/store/index.js',
    reducers: 'client/reducers/index.js',
    middlewares: 'client/middlewares/index.js'
  },
  aggregates: [
    {
      name: 'story',
      commands: 'common/aggregates/story.commands.js',
      projection: 'common/aggregates/story.projection.js'
    },
    {
      name: 'user',
      commands: 'common/aggregates/user.commands.js',
      projection: 'common/aggregates/user.projection.js'
    }
  ],
  viewModels: [
    {
      name: 'storyDetails',
      projection: 'common/view-models/story_details.projection.js',
      serializeState: 'common/view-models/story_details.serialize_state.js',
      deserializeState: 'common/view-models/story_details.deserialize_state.js',
      snapshotAdapter: {
        module: 'common/view-models/snapshot_adapter.module.js',
        options: {
          pathToFile: 'snapshot.db',
          bucketSize: 1
        }
      }
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

export default appConfig
