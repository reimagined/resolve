import { defaultResolveConfig } from 'resolve-scripts'
import appConfig from './config.app'

const prodConfig = {
  ...defaultResolveConfig,
  ...appConfig,

  port: 3000,
  mode: 'production',
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000
  }
}

export default prodConfig
