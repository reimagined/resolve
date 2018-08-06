import { defaultResolveConfig } from 'resolve-scripts'
import appConfig from './config.app'

const prodConfig = {
  ...defaultResolveConfig,
  ...appConfig,

  port: 3000,
  polyfills: ['@babel/runtime/regenerator'],
  mode: 'production',
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {}
  }
}

export default prodConfig
