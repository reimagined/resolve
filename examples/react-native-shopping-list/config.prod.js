import { defaultResolveConfig } from 'resolve-scripts'
import appConfig from './config.domain'

const prodConfig = {
  ...defaultResolveConfig,
  ...appConfig,

  port: 3000,
  polyfills: ['@babel/runtime/regenerator'],
  mode: 'production'
}

export default prodConfig
