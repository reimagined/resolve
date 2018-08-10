const appConfig = {
  routes: 'client/routes.js',
  aggregates: [
    {
      name: 'Todo',
      commands: 'common/aggregates/todo.commands.js'
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
