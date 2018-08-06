import { defaultResolveConfig } from 'resolve-scripts'
import appConfig from './config.app'

const testFunctionalConfig = {
  ...defaultResolveConfig,
  ...appConfig,

  port: 3008,
  polyfills: ['@babel/runtime/regenerator'],
  mode: 'development',
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  },

  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {}
  }
}

export default testFunctionalConfig
