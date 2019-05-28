import { merge, defaultResolveConfig, validateConfig } from 'resolve-scripts'

const localConfig = {
  mode: 'development',
  target: 'local'
}

// mdis-start app-config
const appConfig = {
  readModels: [
    {
      name: 'Counter',
      projection: 'projection.js',
      resolvers: 'resolvers.js',
      connectorName: 'default'
    }
  ]
}
// mdis-stop app-config

// mdis-start dev-config
const devConfig = {
  readModelConnectors: {
    default: {
      module: 'connector.js',
      options: {
        prefix: 'read-model-database'
      }
    }
  }
}
// mdis-stop dev-config

const config = merge(defaultResolveConfig, localConfig, appConfig, devConfig)

validateConfig(config)

export default config
