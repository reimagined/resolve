const appConfig = {
  aggregates: [
    {
      name: 'Story',
      commands: 'common/aggregates/story.commands.ts',
      projection: 'common/aggregates/story.projection.ts',
    },
    {
      name: 'User',
      commands: 'common/aggregates/user.commands.ts',
      projection: 'common/aggregates/user.projection.ts',
    },
  ],
  readModels: [
    {
      name: 'HackerNews',
      projection: 'common/read-models/hacker-news.projection.ts',
      resolvers: 'common/read-models/hacker-news.resolvers.ts',
      connectorName: 'hackerNews',
    },
    {
      name: 'Search',
      projection: 'common/read-models/search.projection.ts',
      resolvers: 'common/read-models/search.resolvers.ts',
      connectorName: 'elasticSearch',
    },
  ],
  sagas: [
    {
      name: 'UserConfirmation',
      source: 'common/sagas/user-confirmation.saga.ts',
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
    {
      handler: 'prometheusHandler.js',        
      path: '/metrics',
      method: 'GET',
    },
  ],
  clientEntries: [
    [
      'client/index.tsx',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web',
      },
    ],
    [
      'client/ssr.tsx',
      {
        outputFile: 'common/local-entry/ssr.js',
        moduleType: 'commonjs',
        target: 'node',
      },
    ],
    [
      'client/ssr.tsx',
      {
        outputFile: 'common/cloud-entry/ssr.js',
        moduleType: 'commonjs',
        target: 'node',
      },
    ],
  ],
}

export default appConfig
