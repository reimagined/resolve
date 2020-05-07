const appConfig = {
  aggregates: [
    {
      name: 'user-profile',
      commands: 'common/aggregates/user-profile.commands.js',
      projection: 'common/aggregates/user-profile.projection.js',
      encryption: 'common/aggregates/encryption.js'
    },
    {
      name: 'media',
      commands: 'common/aggregates/media.commands.js',
      projection: 'common/aggregates/media.projection.js'
    },
    {
      name: 'blog-post',
      commands: 'common/aggregates/blog-post.commands.js',
      projection: 'common/aggregates/blog-post.projection.js'
    }
  ],
  apiHandlers: [
    {
      path: '/api/register-archive',
      controller: 'common/api-handlers/register-archive.js',
      method: 'put'
    }
  ],
  readModels: [
    {
      name: 'user-profiles',
      connectorName: 'default',
      projection: 'common/read-models/user-profiles.projection.js',
      resolvers: 'common/read-models/user-profiles.resolvers.js',
      encryption: 'common/read-models/encryption.js'
    },
    {
      name: 'medias',
      connectorName: 'default',
      projection: 'common/read-models/medias.projection.js',
      resolvers: 'common/read-models/medias.resolvers.js',
      encryption: 'common/read-models/encryption.js'
    },
    {
      name: 'blog-posts',
      connectorName: 'default',
      projection: 'common/read-models/blog-posts.projection.js',
      resolvers: 'common/read-models/blog-posts.resolvers.js'
    }
  ],
  sagas: [
    {
      name: 'personal-data',
      source: 'common/sagas/personal-data.saga.js',
      connectorName: 'default',
      schedulerName: 'scheduler'
    }
  ],
  clientEntries: [
/*     [
      'client/index.js',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web'
      }
    ] */

    [
      'client/index.js',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web'
      }
    ]

  ]
}

export default appConfig
