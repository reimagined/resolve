const appConfig = {
  aggregates: [
    {
      name: 'user-profile',
      commands: 'common/aggregates/user-profile.commands.ts',
      projection: 'common/aggregates/user-profile.projection.ts',
      encryption: 'common/aggregates/encryption.ts'
    },
    {
      name: 'media',
      commands: 'common/aggregates/media.commands.ts',
      projection: 'common/aggregates/media.projection.ts'
    },
    {
      name: 'blog-post',
      commands: 'common/aggregates/blog-post.commands.ts',
      projection: 'common/aggregates/blog-post.projection.ts'
    }
  ],
  readModels: [
    {
      name: 'user-profiles',
      connectorName: 'default',
      projection: 'common/read-models/user-profiles.projection.ts',
      resolvers: 'common/read-models/user-profiles.resolvers.ts',
      encryption: 'common/read-models/encryption.ts'
    },
    {
      name: 'blog-posts',
      connectorName: 'default',
      projection: 'common/read-models/blog-posts.projection.ts',
      resolvers: 'common/read-models/blog-posts.resolvers.ts'
    }
  ],
  sagas: [
    {
      name: 'personal-data',
      source: 'common/sagas/personal-data.saga.ts',
      connectorName: 'default',
      schedulerName: 'scheduler'
    }
  ],
  clientEntries: [
    [
      'client/index.tsx',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web'
      }
    ]
  ]
}

export default appConfig
