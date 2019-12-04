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
        path: '/api/uploader/getToken',
        controller: {
          module: 'resolve-module-uploader/lib/api-handlers/getToken.js',
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
