import { defaultResolveConfig } from 'resolve-scripts'
import appConfig from './config.app'

const devConfig = {
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
  }
}

export default devConfig
