const appConfig = {
  aggregates: [
    {
      name: 'Story',
      commands: 'common/aggregates/story.commands.js',
      projection: 'common/aggregates/story.projection.js',
    },
    {
      name: 'User',
      commands: 'common/aggregates/user.commands.js',
      projection: 'common/aggregates/user.projection.js',
    },
  ],
  readModels: [
    {
      name: 'HackerNews',
      projection: 'common/read-models/hacker-news.projection.js',
      resolvers: 'common/read-models/hacker-news.resolvers.js',
      connectorName: 'hackerNews',
    },
    {
      name: 'Search',
      projection: 'common/read-models/search.projection.js',
      resolvers: 'common/read-models/search.resolvers.js',
      connectorName: 'elasticSearch',
    },
  ],
  sagas: [
    {
      name: 'UserConfirmation',
      source: 'common/sagas/user-confirmation.saga.js',
      connectorName: 'default',
    },
  ],
  apiHandlers: [
    {
      handler: {
        module: {
          package: '@resolve-js/runtime-base',
          import: 'liveRequireHandler',
        },
        options: {
          modulePath: './ssr.js',
          moduleFactoryImport: false,
        },
      },
      path: '/:markup*',
      method: 'GET',
    },
  ],
  clientEntries: [
    [
      'client/index.js',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web',
      },
    ],
    [
      'client/ssr.js',
      {
        outputFile: 'common/local-entry/ssr.js',
        moduleType: 'commonjs',
        target: 'node',
      },
    ],
    [
      'client/ssr.js',
      {
        outputFile: 'common/cloud-entry/ssr.js',
        moduleType: 'commonjs',
        target: 'node',
      },
    ],
  ],
}
export default appConfig
