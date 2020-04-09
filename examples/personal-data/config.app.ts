const appConfig = {
  aggregates: [
    {
      name: 'user-profile',
      commands: 'common/aggregates/user-profile.commands.ts',
      projection: 'common/aggregates/user-profile.projection.ts'
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
      resolvers: 'common/read-models/user-profiles.resolvers.ts'
    },
    {
      name: 'blog-posts',
      connectorName: 'default',
      projection: 'common/read-models/blog-posts.projection.ts',
      resolvers: 'common/read-models/blog-posts.resolvers.ts'
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
