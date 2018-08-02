import { defaultResolveConfig, build, start, watch } from 'resolve-scripts'

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
      name: 'Todos',
      projection: 'common/view-models/todos.projection.js'
    }
  ]
}

async function main() {
  const launchMode = process.argv[2]

  switch (launchMode) {
    case 'dev': {
      await watch({
        ...config,
        mode: 'development'
      })
      break
    }

    case 'build': {
      await build({
        ...config,
        mode: 'production'
      })
      break
    }

    case 'start': {
      await start(config)

      break
    }

    default: {
      throw new Error('Unknown option')
    }
  }
}

main().catch(error => {
  // eslint-disable-next-line no-console
  console.log(error)
})
