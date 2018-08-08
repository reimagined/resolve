import { defaultResolveConfig } from 'resolve-scripts'
import appConfig from './config.app'

const testFunctionalConfig = {
  ...defaultResolveConfig,
  ...appConfig,

  port: 3000,
  polyfills: ['@babel/runtime/regenerator'],
  mode: 'development',
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {}
  }
}

export default testFunctionalConfig
