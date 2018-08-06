import { defaultResolveConfig } from 'resolve-scripts'
import appConfig from './config.app'

const devConfig = {
  ...defaultResolveConfig,
  ...appConfig,

  port: 3001,
  polyfills: ['@babel/runtime/regenerator'],
  mode: 'development'
}

export default devConfig
