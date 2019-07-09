import { merge, defaultResolveConfig, validateConfig } from 'resolve-scripts'

const localConfig = {
  mode: 'development',
  target: 'local'
}

// mdis-start app-config
const appConfig = {
  sagas: [
    {
      name: 'UpdaterSaga',
      source: 'saga.js',
      connectorName: 'default',
      schedulerName: 'scheduler'
    }
  ]
}
// mdis-stop app-config

// mdis-start dev-config
const devConfig = {
  // mdis-start schedulers-config
  schedulers: {
    scheduler: {
      adapter: {
        module: 'resolve-scheduler-local',
        options: {}
      },
      connectorName: 'default'
    }
  },
  // mdis-stop schedulers-config
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
        database: 'SagaMockSideEffectsSample'
      }
    }
    */
    /*
    default: {
      module: 'resolve-readmodel-mongo',
      options: {
        url: 'mongodb://127.0.0.1:27017/SagaMockSideEffectsSample'
      }
    }
    */
  }
}
// mdis-stop dev-config

const config = merge(defaultResolveConfig, localConfig, appConfig, devConfig)

validateConfig(config)

export default config
