import { defaultResolveConfig } from 'resolve-scripts'
import appConfig from './config.app'

const prodConfig = {
  ...defaultResolveConfig,
  ...appConfig,

  port: 3004,
  polyfills: ['@babel/runtime/regenerator'],
  mode: 'production'
}

export default prodConfig
