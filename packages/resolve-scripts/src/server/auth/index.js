import localStrategyCallbackCreator from './strategy-callback-creators/local'
import azureadStrategyCallbackCreator from './strategy-callback-creators/azuread'
import oauthStrategyCallbackCreator from './strategy-callback-creators/oauth'

const strategyCallbackCreators = {
  local: localStrategyCallbackCreator,
  'azuread-openidconnect': azureadStrategyCallbackCreator,
  github: oauthStrategyCallbackCreator,
  google: oauthStrategyCallbackCreator
}

const getStarategyName = (PassportStrategy, options) => {
  const strategy = new PassportStrategy(
    {
      ...options,
      passReqToCallback: true
    },
    () => {}
  )
  return strategy.name
}

export default (PassportStrategy, options) => {
  const strategyName = getStarategyName(PassportStrategy, options.strategy)

  const callbackCreator = strategyCallbackCreators[strategyName]
  if (!callbackCreator) {
    throw new Error(`Callback for the '${strategyName}' strategy is absent`)
  }

  return Object.keys(options.routes).map(key => {
    const route = options.routes[key]

    return {
      route,
      callback: (req, res, callbackOptions) => {
        const strategy = new PassportStrategy(
          {
            ...options.strategy,
            passReqToCallback: true
          },
          callbackCreator(options)
        )
        strategy.success = callbackOptions.onSuccess.bind(null, options)
        strategy.fail = callbackOptions.onFail.bind(null, options)
        strategy.redirect = callbackOptions.onRedirect.bind(null, options)
        strategy.pass = callbackOptions.onPass.bind(null, options)
        strategy.error = callbackOptions.onError.bind(null, options)
        strategy.authenticate(req, { response: res })
      }
    }
  })
}
