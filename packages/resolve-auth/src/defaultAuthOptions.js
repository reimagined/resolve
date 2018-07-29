import { getRootBasedUrl } from './helpers'

const applyJwtValue = (jwtToken, res) => {
  const { name: cookieName, ...cookieOptions } = { name: 'jwt' } // TODO get from config
  res.cookies[cookieName] = {
    name: cookieName,
    value: jwtToken,
    cookieOptions
  }
}

const redirect = location => ({
  statusCode: 302,
  headers: {
    Location: location,
    'Content-Length': '0'
  }
})

export default {
  success: async (options, req, res, next, arg /*, info*/) => {
    await applyJwtValue(arg, res)
    Object.assign(
      res,
      redirect(getRootBasedUrl(options.successRedirect || '/'))
    )
  },
  fail: async (options, req, res, next, error, status) => {
    if (options.failureRedirect) {
      Object.assign(
        res,
        redirect(
          getRootBasedUrl(
            typeof options.failureRedirect === 'function'
              ? options.failureRedirect(error)
              : options.failureRedirect
          )
        )
      )
    } else {
      res.statusCode = status || 401
      res.error = JSON.stringify(error)
    }
  },
  redirect: async (options, req, res, next, url) => {
    Object.assign(res, redirect(url))
  },
  pass: async (options, req, res, next) => {
    res.statusCode = 200
    next()
  },
  error: async (options, req, res, next, err) => {
    if (options.errorRedirect) {
      Object.assign(
        res,
        redirect(
          getRootBasedUrl(
            typeof options.errorRedirect === 'function'
              ? options.errorRedirect(err)
              : options.errorRedirect
          )
        )
      )
    } else {
      next(err)
    }
  }
}
