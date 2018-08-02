import { defaultResolveConfig, build, start, watch } from 'resolve-scripts'

const config = {
  ...defaultResolveConfig,
  port: 3000,
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  routes: 'client/routes.js',
  aggregates: [
    {
      name: 'aggregate-name',
      commands: 'common/aggregates/aggregate-name.commands.js',
      projection: 'common/aggregates/aggregate-name.projection.js'
    }
  ],
  readModels: [
    {
      name: 'read-model-name',
      projection: 'common/read-models/read-model-name.projection.js',
      resolvers: 'common/read-models/read-model-name.resolvers.js',
      adapter: {
        module: 'resolve-readmodel-memory',
        options: {}
      }
    }
  ],
  viewModels: [
    {
      name: 'view-model-name',
      projection: 'common/view-models/view-model-name.projection.js',
      serializeState: 'common/view-models/view-model-name.serialize_state.js',
      deserializeState:
        'common/view-models/view-model-name.deserialize_state.js'
    }
  ],
  sagas: 'common/sagas/index.js',
  auth: {
    strategies: 'auth/index.js'
  },
  redux: {
    store: 'client/store/index.js',
    reducers: 'client/reducers/index.js',
    middlewares: 'client/middlewares/index.js'
  },
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {
      pathToFile: 'event-storage.db'
    }
  },
  busAdapter: {
    module: 'resolve-bus-memory',
    options: {}
  },
  subscribeAdapter: {
    module: 'resolve-subscribe-socket.io',
    options: {}
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  }
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
