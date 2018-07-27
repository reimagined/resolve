import defaultAuthOptions from './defaultAuthOptions'

const resolveAuth = (strategyConstructor, options) => ({
  route: options.route,
  callback: async (req, res, next) => {
    const strategy = strategyConstructor(options)

    let fakeResponse = {
      statusCode: 200,
      headers: {},
      cookies: {}
    }

    console.log('Promise')
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
            console.log('resolve')
            resolve()
          })
      )
      strategy.authenticate(req, { response: res })
    })
    console.log('buildResponse')

    ;(options.buildResponse || (f => f))(res, fakeResponse)
  }
})

export { resolveAuth }
