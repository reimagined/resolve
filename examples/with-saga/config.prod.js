import { defaultResolveConfig } from 'resolve-scripts'
import appConfig from './config.app'

const prodConfig = {
  ...defaultResolveConfig,
  ...appConfig,

  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'production',
  readModelAdapters: {
    default: {
      module: 'resolve-readmodel-memory',
      options: {}
    }
  }
}

export default prodConfig
