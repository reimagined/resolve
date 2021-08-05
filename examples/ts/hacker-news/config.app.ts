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
  staticPath: undefined,
  staticRoutes: [
    ['/', 'index.html'],
    ['/index', 'index.html'],
    ['/error', 'index.html'],
    ['/login', 'index.html'],
    ['/comments/:wildcard*', 'index.html'],
    ['/user/:wildcard*', 'index.html'],
    ['/newest/:wildcard*', 'index.html'],
    ['/show/:wildcard*', 'index.html'],
    ['/ask/:wildcard*', 'index.html'],
    ['/submit/:wildcard*', 'index.html'],
    ['/storyDetails/:wildcard*', 'index.html'],
    ['/comments', 'index.html'],
    ['/user', 'index.html'],
    ['/newest', 'index.html'],
    ['/show', 'index.html'],
    ['/ask', 'index.html'],
    ['/submit', 'index.html'],
    ['/storyDetails', 'index.html'],
    '/:static*',
  ],
}

export default appConfig
