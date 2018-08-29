import authenticate from './authenticate'
import createResponse from './create_response'

const createStrategy = (
  strategyConstructor,
  options,
  { jwtCookie, rootPath, getRootBasedUrl }
) => {
  const strategy = strategyConstructor(options)

  return {
    route: options.route,
    callback: async req => {
      const res = createResponse()

      await authenticate(strategy, req, res, options, {
        jwtCookie,
        rootPath,
        getRootBasedUrl
      })

      return res
    }
  }
}

export default createStrategy
