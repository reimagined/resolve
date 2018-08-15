const appConfig = {
  routes: 'client/routes.js',
  redux: {
    store: 'client/store/index.js',
    reducers: 'client/reducers/optimistic.js',
    middlewares: 'client/middlewares/optimistic.js'
  },
  aggregates: [
    {
      name: 'Todo',
      commands: 'common/aggregates/todo.commands.js'
    }
  ],
  readModels: [
    {
      name: 'default',
      projection: 'common/read-models/default.projection.js',
      resolvers: 'common/read-models/default.resolvers.js'
    }
  ],
  viewModels: [
    {
      name: 'Todos',
      projection: 'common/view-models/todos.projection.js'
    }
  ]
}

export default appConfig
