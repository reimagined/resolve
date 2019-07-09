import { merge, defaultResolveConfig, validateConfig } from 'resolve-scripts'

const localConfig = {
  mode: 'development',
  target: 'local'
}

// mdis-start app-config
const appConfig = {
  readModels: [
    {
      name: 'Stories',
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
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: ':memory:'
      }
    }
    /*
    default: {
      module: 'resolve-readmodel-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'ReadModelStoriesSample'
      }
    }
    */
    /*
    default: {
      module: 'resolve-readmodel-mongo',
      options: {
        url: 'mongodb://127.0.0.1:27017/ReadModelStoriesSample'
      }
    }
    */
  }
}
// mdis-stop dev-config

const config = merge(defaultResolveConfig, localConfig, appConfig, devConfig)

validateConfig(config)

export default config
