import { merge, defaultResolveConfig, validateConfig } from 'resolve-scripts'

const localConfig = {
  mode: 'development',
  target: 'local',
}

// mdis-start app-config
const appConfig = {
  sagas: [
    {
      name: 'UpdaterSaga',
      source: 'saga.js',
      connectorName: 'default',
    },
  ],
}
// mdis-stop app-config

// mdis-start dev-config
const devConfig = {
  eventstoreAdapter: {
    module: 'resolve-eventstore-lite',
    options: {
      databaseFile: ':memory:',
    },
  },
  readModelConnectors: {
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: ':memory:',
        preferEventBusLedger: true,
      },
    },
    /*
    default: {
      module: 'resolve-readmodel-mysql',
      options: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'SagaMockSideEffectsSample'
      }
    }
    */
  },
}
// mdis-stop dev-config

const config = merge(defaultResolveConfig, localConfig, appConfig, devConfig)

validateConfig(config)

export default config
