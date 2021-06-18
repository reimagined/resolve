const appConfig = {
  aggregates: [
    {
      name: 'Chat',
      commands: 'common/aggregates/chat.commands.js',
    },
  ],
  viewModels: [
    {
      name: 'chat',
      projection: 'common/view-models/chat.projection.js',
    },
  ],
  apiHandlers: [
    {
      path: '/:markup*',
      handler: 'common/api-handlers/markup.js',
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
  ],
}
export default appConfig
