const appConfig = {
  apiHandlers: [
    {
      path: '/api/upload',
      controller: 'common/api-handlers/upload.js',
      method: 'GET'
    },
    {
      path: '/api/createToken',
      controller: 'common/api-handlers/createToken.js',
      method: 'GET'
    }
  ],
  clientEntries: ['client/index.js']
}

export default appConfig
