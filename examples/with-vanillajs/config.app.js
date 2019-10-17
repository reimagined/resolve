const appConfig = {
  aggregates: [
    {
      name: 'Chat',
      commands: 'common/aggregates/chat.commands.js'
    }
  ],
  viewModels: [
    {
      name: 'chat',
      projection: 'common/view-models/chat.projection.js'
    }
  ],
  apiHandlers: [
    {
      path: '/:markup*',
      controller: 'common/api-handlers/markup.js',
      method: 'GET'
    }
  ]
}

export default appConfig
