const createModule = () => {
  const config = {
    apiHandlers: [
      {
        path: '/api/uploader/getFormUpload',
        controller: 'resolve-module-uploader/lib/api-handlers/getFormUpload.js',
        method: 'GET'
      },
      {
        path: '/api/uploader/createToken',
        controller: 'resolve-module-uploader/lib/api-handlers/createToken.js',
        method: 'GET'
      }
    ]
  }

  return config
}

export default createModule
