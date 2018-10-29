import { defaultResolveConfig } from 'resolve-scripts'
import appConfig from './config.app'

const testFunctionalConfig = {
  ...defaultResolveConfig,
  ...appConfig,

  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'development',
  readModelAdapters: {
    default: {
      module: 'resolve-readmodel-memory',
      options: {}
    }
  },
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {}
  }
}

export default testFunctionalConfig
