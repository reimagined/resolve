const appConfig = {
  aggregates: [
    {
      name: 'Chat',
      commands: 'common/aggregates/chat.commands.ts',
    },
  ],
  viewModels: [
    {
      name: 'chat',
      projection: 'common/view-models/chat.projection.ts',
    },
  ],
  apiHandlers: [
    {
      path: '/:markup*',
      handler: 'common/api-handlers/markup.ts',
      method: 'GET',
    },
  ],
  clientEntries: [
    [
      'client/index.ts',
      {
        outputFile: 'client/index.js',
        moduleType: 'iife',
        target: 'web',
      },
    ],
  ],
}

export default appConfig
