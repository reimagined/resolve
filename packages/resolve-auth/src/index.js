import defaultAuthOptions from './defaultAuthOptions'

const createResponse = () => {
  const response = {
    statusCode: 200,
    headers: {},
    cookies: {},
    cookie: (name, value, opts) => {
      response.cookies[name] = { name, value, opts }
    },
    clearCookie: name => {
      response.cookies[name] = {
        name,
        value: 'deleted',
        options: { expires: new Date(0) }
      }
    }
  }
  return response
}

const resolveAuth = (strategyConstructor, options, config) => ({
  route: options.route,
  callback: async (req, res, next) => {
    const extendedOptions = { ...options, $resolveConfig: config }
    const strategy = strategyConstructor(extendedOptions)

    const fakeResponse = {
      statusCode: 200,
      headers: {},
      cookies: {}
    }

    const resResponse = res || createResponse()
    await new Promise(resolve => {
      Object.keys(defaultAuthOptions).forEach(key => {
        strategy[key] = async (...args) => {
          await defaultAuthOptions[key](
            extendedOptions,
            req,
            fakeResponse,
            next,
            ...args
          )
          resolve()
        }
      })
      strategy.authenticate(req, { response: resResponse })
    })
    return res
      ? fakeResponse
      : Object.assign({}, resResponse, fakeResponse, {
          headers: Object.assign({}, res.headers, fakeResponse.headers),
          cookies: Object.assign({}, res.cookies, fakeResponse.cookies)
        })
  }
})

export default resolveAuth
