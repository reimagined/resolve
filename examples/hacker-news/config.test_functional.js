import { defaultResolveConfig } from 'resolve-scripts'
import appConfig from './config.app'

const testFunctionalConfig = {
  ...defaultResolveConfig,
  ...appConfig,

  port: 3000,
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
