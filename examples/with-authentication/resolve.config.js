import { defaultResolveConfig } from 'resolve-scripts'

export default () => {
  const config = {
    ...defaultResolveConfig,
    port: 3000,
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
  const launchMode = process.argv[2]

  switch (launchMode) {
    case 'dev':
      return {
        ...config,
        mode: 'development'
      }

    case 'start':
    case 'build':
      return {
        ...config,
        mode: 'production'
      }

    case 'runready':
      return {
        ...config,
        storageAdapter: {
          module: 'resolve-storage-lite',
          options: {}
        },
        mode: 'test'
      }

    default:
      return config
  }
}
