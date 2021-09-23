import {
  merge,
  defaultResolveConfig,
  validateConfig,
} from '@resolve-js/scripts'

const localConfig = {
  mode: 'development',
  runtime: {
    module: '@resolve-js/runtime-dev',
    options: {
      host: 'localhost',
      port: 3000,
    },
  },
}

// mdis-start app-config
const appConfig = {
  readModels: [
    {
      name: 'Counter',
      projection: 'projection.js',
      resolvers: 'resolvers.js',
      connectorName: 'default',
    },
  ],
}
// mdis-stop app-config

// mdis-start dev-config
const devConfig = {
  eventstoreAdapter: {
    module: '@resolve-js/eventstore-lite',
    options: {
      databaseFile: ':memory:',
    },
  },

  readModelConnectors: {
    default: {
      module: 'connector.js',
      options: {
        prefix: 'read-model-database',
      },
    },
  },
}
// mdis-stop dev-config

const config = merge(defaultResolveConfig, localConfig, appConfig, devConfig)

validateConfig(config)

export default config
