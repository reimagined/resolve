import getRootBasedUrl from './get_root_based_url'

const TIMEOUT = 30000

const authenticate = (strategy, req, res, options, { jwtCookie, rootPath }) => {
  const wrapper = Object.create(Object.getPrototypeOf(strategy))

  for (const key of Reflect.ownKeys(strategy)) {
    const descriptor = Object.getOwnPropertyDescriptor(strategy, key)

    Object.defineProperty(wrapper, key, descriptor)
  }

  return new Promise((next, fail) => {
    Object.assign(wrapper, {
      success: jwtToken => {
        const { name: cookieName, ...cookieOptions } = jwtCookie

        res.cookie(cookieName, jwtToken, cookieOptions)
        res.setHeader('Authorization', `Bearer ${jwtToken}`)

        res.redirect(getRootBasedUrl(rootPath, options.successRedirect || '/'))

        next()
      },

      fail: (error, status) => {
        const { name: cookieName } = jwtCookie

        res.clearCookie(cookieName)

        if (options.failureRedirect) {
          res.redirect(
            getRootBasedUrl(
              rootPath,
              typeof options.failureRedirect === 'function'
                ? options.failureRedirect(error)
                : options.failureRedirect
            )
          )
        } else {
          res.statusCode = error.status || status || 401
          if (error && error.message) {
            res.error = error.message
          }
        }

        next()
      },

      redirect: url => {
        res.redirect(getRootBasedUrl(rootPath, url || '/'))

        next()
      },

      pass: () => {
        res.statusCode = 200

        next()
      },

      error: (error, status) => {
        if (options.errorRedirect) {
          res.redirect(
            getRootBasedUrl(
              rootPath,
              typeof options.errorRedirect === 'function'
                ? options.errorRedirect(error)
                : options.errorRedirect
            )
          )
        } else {
          res.statusCode = error.status || status || 401
          res.error = (error && error.message) || ''
        }

        next()
      }
    })

    wrapper.authenticate(req, { response: res })

    setTimeout(fail, TIMEOUT)
  })
}

export default authenticate
