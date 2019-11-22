const createModule = options => {
  const config = {
    apiHandlers: [
      {
        path: '/api/uploader/getFormUpload',
        controller: {
          module: 'resolve-module-uploader/lib/api-handlers/getFormUpload.js',
          options
        },
        method: 'GET'
      },
      {
        path: '/api/uploader/createToken',
        controller: {
          module: 'resolve-module-uploader/lib/api-handlers/createToken.js',
          options
        },
        method: 'GET'
      }
    ],
    aggregates: [
      {
        name: 'Uploader',
        commands: {
          module: 'resolve-module-uploader/lib/aggregates/uploader.commands.js',
          options
        }
      }
    ]
  }

  return config
}

export default createModule
