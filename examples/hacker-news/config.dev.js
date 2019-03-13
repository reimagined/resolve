const devConfig = {
  target: 'local',
  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  redux: {
    enhancers: ['client/enhancers/redux-devtools.js']
  },
  readModelAdapters: [
    {
      name: 'default',
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'read-models.db'
      }
    }
  ],
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  }
}

export default devConfig
