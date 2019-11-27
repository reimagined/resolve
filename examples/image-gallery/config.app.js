const appConfig = {
  aggregates: [
    {
      name: 'Image',
      commands: 'common/aggregates/image.commands.js'
    }
  ],
  readModels: [
    {
      name: 'Images',
      projection: 'common/read-models/images.projection.js',
      resolvers: 'common/read-models/images.resolvers.js',
      connectorName: 'default'
    }
  ],
  apiHandlers: [
    {
      path: '/api/uploader/getStaticToken',
      controller: 'common/api-handlers/getStaticToken.js',
      method: 'GET'
    }
  ],
  clientEntries: ['client/index.js']
}

export default appConfig
