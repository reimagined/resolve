import { defaultResolveConfig } from 'resolve-scripts'
import appConfig from './config.app'

const devConfig = {
  ...defaultResolveConfig,
  ...appConfig,

  port: 3000,
  polyfills: ['@babel/runtime/regenerator'],
  mode: 'development',
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  }
}

export default devConfig
