import { defaultResolveConfig } from 'resolve-scripts'
import appConfig from './config.app'

const prodConfig = {
  ...defaultResolveConfig,
  ...appConfig,

  port: 3002,
  polyfills: ['@babel/runtime/regenerator'],
  mode: 'production'
}

export default prodConfig
