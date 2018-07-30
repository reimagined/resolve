import defaultAuthOptions from './defaultAuthOptions'

const createResponse = () => {}

const resolveAuth = (strategyConstructor, options) => ({
  route: options.route,
  callback: async (req, res, next) => {
    const strategy = strategyConstructor(options)

    let fakeResponse = {
      statusCode: 200,
      headers: {},
      cookies: {}
    }

    await new Promise(resolve => {
      Object.keys(defaultAuthOptions).forEach(
        key =>
          (strategy[key] = async (...args) => {
            await defaultAuthOptions[key](
              options,
              req,
              fakeResponse,
              next,
              ...args
            )
            resolve()
          })
      )
      strategy.authenticate(req, { response: res })
    })
    return fakeResponse
  }
})

export { resolveAuth }
