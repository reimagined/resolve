import { createRequest, createResponse, getRootableUrl } from './helpers'
import createAuthOptions from './createAuthOptions'

const resolveAuth = (strategyConstructor, options) => {
  return Object.keys(options.routes).map(key => ({
    route: options.routes[key],
    callback: async (req, res, callbackOptions) => {
      let strategy = strategyConstructor(options)

      strategy.success = callbackOptions.onSuccess.bind(null, options)
      strategy.fail = callbackOptions.onFail.bind(null, options)
      strategy.redirect = callbackOptions.onRedirect.bind(null, options)
      strategy.pass = callbackOptions.onPass.bind(null, options)
      strategy.error = callbackOptions.onError.bind(null, options)
      strategy.authenticate(req, { response: res })
    }
  }))
}

export {
  createAuthOptions,
  createRequest,
  createResponse,
  getRootableUrl,
  resolveAuth
}
