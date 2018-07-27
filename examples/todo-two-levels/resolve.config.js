import { defaultResolveConfig } from 'resolve-scripts'

export default () => {
  const config = {
    ...defaultResolveConfig,
    port: 3000,
    routes: 'client/routes.js',
    aggregates: [
      {
        name: 'Todo',
        commands: 'common/aggregates/todo.commands.js'
      }
    ],
    viewModels: [
      {
        name: 'Lists',
        projection: 'common/view-models/lists.projection.js'
      },
      {
        name: 'Todos',
        projection: 'common/view-models/todos.projection.js'
      }
    ]
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
