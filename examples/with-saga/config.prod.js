import { defaultResolveConfig } from 'resolve-scripts'
import appConfig from './config.app'

const prodConfig = {
  ...defaultResolveConfig,
  ...appConfig,

  port: 3000,
  polyfills: ['@babel/polyfill'],
  mode: 'production'
}

export default prodConfig
