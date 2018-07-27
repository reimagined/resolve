import { defaultResolveConfig } from 'resolve-scripts'

export default () => {
  const config = {
    ...defaultResolveConfig,

    port: 3000,
    routes: 'client/routes.js',
    aggregates: [
      {
        name: 'Rating',
        commands: 'common/aggregates/rating.commands.js'
      }
    ],
    readModels: [
      {
        name: 'Rating',
        projection: 'common/read-models/rating.projection.js',
        resolvers: 'common/read-models/rating.resolvers.js'
      }
    ],
    sagas: 'common/sagas/index.js',
    storageAdapter: {
      module: 'resolve-storage-lite',
      options: {}
    }
  }

  const launchMode = process.argv[2]

  switch (launchMode) {
    case 'start':
    case 'build':
      return {
        ...config,
        mode: 'production'
      }

    default:
      return {
        ...config,
        mode: 'development'
      }
  }
}
