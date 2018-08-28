import createStrategyWrapper from './create_strategy_wrapper'
import createResponse from './create_response'

const createStrategy = (strategyConstructor, options, { jwtCookie, rootPath, getRootBasedUrl }) => {
  const strategy = strategyConstructor(options)
  
  return {
    route: options.route,
    callback: async (req) => {
      const res = createResponse()
      
      const strategyWrapper = createStrategyWrapper(
        strategy,
        req,
        res,
        options,
        { jwtCookie, rootPath, getRootBasedUrl }
      )
      
      console.log( strategy.authenticate)
      console.log( strategyWrapper.authenticate)
  
      strategyWrapper.authenticate(req, { response: res })
      
      return res
    }
  }
}

export default createStrategy
