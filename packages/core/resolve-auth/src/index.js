import { createRequest, createResponse } from './helpers'
import createAuthOptions from './createAuthOptions'

const resolveAuth = (strategyConstructor, options) => ({
  route: options.route,
  callback: async (req, res, callbackOptions) => {
    const strategy = strategyConstructor(options)

    strategy.success = callbackOptions.onSuccess.bind(null, options)
    strategy.fail = callbackOptions.onFail.bind(null, options)
    strategy.redirect = callbackOptions.onRedirect.bind(null, options)
    strategy.pass = callbackOptions.onPass.bind(null, options)
    strategy.error = callbackOptions.onError.bind(null, options)
    strategy.authenticate(req, { response: res })
  }
})

export { createAuthOptions, createRequest, createResponse, resolveAuth }
