const appConfig = {
  routes: 'client/routes.js',
  readModels: [
    {
      name: 'me',
      projection: 'common/read-models/me.projection.js',
      resolvers: 'common/read-models/me.resolvers.js'
    }
  ],
  auth: {
    strategies: 'auth/index.js'
  }
}

export default appConfig
