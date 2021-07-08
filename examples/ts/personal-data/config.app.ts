const appConfig = {
  aggregates: [
    {
      name: 'user-profile',
      commands: 'common/aggregates/user-profile.commands.ts',
      projection: 'common/aggregates/user-profile.projection.ts',
      encryption: 'common/aggregates/encryption.ts',
    },
    {
      name: 'media',
      commands: 'common/aggregates/media.commands.ts',
      projection: 'common/aggregates/media.projection.ts',
    },
    {
      name: 'blog-post',
      commands: 'common/aggregates/blog-post.commands.ts',
      projection: 'common/aggregates/blog-post.projection.ts',
    },
  ],
  viewModels: [
    {
      name: 'current-user-profile',
      projection: 'common/view-models/current-user-profile.projection.ts',
      resolver: 'common/view-models/current-user-profile.resolver.ts',
    },
  ],
  readModels: [
    {
      name: 'user-profiles',
      connectorName: 'default',
      projection: 'common/read-models/user-profiles.projection.ts',
      resolvers: 'common/read-models/user-profiles.resolvers.ts',
      encryption: 'common/read-models/encryption.ts',
    },
    {
      name: 'medias',
      connectorName: 'default',
      projection: 'common/read-models/medias.projection.ts',
      resolvers: 'common/read-models/medias.resolvers.ts',
    },
    {
      name: 'blog-posts',
      connectorName: 'default',
      projection: 'common/read-models/blog-posts.projection.ts',
      resolvers: 'common/read-models/blog-posts.resolvers.ts',
    },
  ],
  sagas: [
    {
      name: 'personal-data',
      source: 'common/sagas/personal-data.saga.ts',
      connectorName: 'default',
    },
  ],
  apiHandlers: [
    {
      handler: 'common/api-handlers/get-personal-key.ts',
      path: '/api/personal-data-keys/:userId',
      method: 'GET',
    },
    {
      handler: 'common/api-handlers/delete-personal-key.ts',
      path: '/api/personal-data-keys/:userId',
      method: 'DELETE',
    },
  ],
  middlewares: {
    aggregate: ['common/middlewares/auth-command-middleware.ts'],
    readModel: { resolver: ['common/middlewares/auth-resolver-middleware.ts'] },
  },
  clientEntries: [
    [
      'client/index.tsx',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web',
      },
    ],
  ],
}

export default appConfig
