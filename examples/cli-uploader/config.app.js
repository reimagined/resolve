const appConfig = {
  aggregates: [
    {
      name: 'File',
      commands: 'common/aggregates/file.commands.js'
    },
    {
      name: 'User',
      commands: 'common/aggregates/user.commands.js'
    }
  ],
  apiHandlers: [
    {
      path: '/api/uploader/getFileUrl',
      handler: 'common/api-handlers/getFileUrl.js',
      method: 'GET'
    }
  ],
  readModels: [
    {
      name: 'Files',
      projection: 'common/read-models/files.projection.js',
      resolvers: 'common/read-models/files.resolvers.js',
      connectorName: 'files'
    },
    {
      name: 'Users',
      projection: 'common/read-models/users.projection.js',
      resolvers: 'common/read-models/users.resolvers.js',
      connectorName: 'users'
    }
  ],
  clientEntries: ['client/index.js']
}

export default appConfig
