import {
  merge,
  defaultResolveConfig,
  validateConfig,
} from '@resolve-js/scripts'

const localConfig = {
  mode: 'development',
  runtime: {
    module: '@resolve-js/runtime-single-process',
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
      name: 'Advanced',
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
      module: '@resolve-js/readmodel-lite',
      options: {
        databaseFile: ':memory:',
      },
    },
    /*
    default: {
      module: 'readmodel-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: `ReadModelAdvancedSample`
      }
    }
    */
  },
}
// mdis-stop dev-config

const config = merge(defaultResolveConfig, localConfig, appConfig, devConfig)

validateConfig(config)

export default config
