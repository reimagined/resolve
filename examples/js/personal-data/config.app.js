const appConfig = {
  aggregates: [
    {
      name: 'user-profile',
      commands: 'common/aggregates/user-profile.commands.js',
      projection: 'common/aggregates/user-profile.projection.js',
      encryption: 'common/aggregates/encryption.js',
    },
    {
      name: 'media',
      commands: 'common/aggregates/media.commands.js',
      projection: 'common/aggregates/media.projection.js',
    },
    {
      name: 'blog-post',
      commands: 'common/aggregates/blog-post.commands.js',
      projection: 'common/aggregates/blog-post.projection.js',
    },
  ],
  viewModels: [
    {
      name: 'current-user-profile',
      projection: 'common/view-models/current-user-profile.projection.js',
      resolver: 'common/view-models/current-user-profile.resolver.js',
    },
  ],
  readModels: [
    {
      name: 'user-profiles',
      connectorName: 'default',
      projection: 'common/read-models/user-profiles.projection.js',
      resolvers: 'common/read-models/user-profiles.resolvers.js',
      encryption: 'common/read-models/encryption.js',
    },
    {
      name: 'medias',
      connectorName: 'default',
      projection: 'common/read-models/medias.projection.js',
      resolvers: 'common/read-models/medias.resolvers.js',
    },
    {
      name: 'blog-posts',
      connectorName: 'default',
      projection: 'common/read-models/blog-posts.projection.js',
      resolvers: 'common/read-models/blog-posts.resolvers.js',
    },
  ],
  sagas: [
    {
      name: 'personal-data',
      source: 'common/sagas/personal-data.saga.js',
      connectorName: 'default',
    },
  ],
  apiHandlers: [
    {
      handler: 'common/api-handlers/get-personal-key.js',
      path: '/api/personal-data-keys/:userId',
      method: 'GET',
    },
    {
      handler: 'common/api-handlers/delete-personal-key.js',
      path: '/api/personal-data-keys/:userId',
      method: 'DELETE',
    },
  ],
  middlewares: {
    aggregate: ['common/middlewares/auth-command-middleware.js'],
    readModel: { resolver: ['common/middlewares/auth-resolver-middleware.js'] },
  },
  clientEntries: [
    [
      'client/index.js',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web',
      },
    ],
  ],
}
export default appConfig
