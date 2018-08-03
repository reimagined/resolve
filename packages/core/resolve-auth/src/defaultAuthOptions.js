const getRootBasedUrl = (rootPath, path) => {
  if (/^https?:\/\//.test(path)) {
    throw new Error(`Absolute path not allowed: ${path}`)
  }
  return `${rootPath}/${path.replace(/^\//, '')}`
}

const applyJwtValue = (
  { name: cookieName, ...cookieOptions },
  jwtToken,
  res
) => {
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
    await applyJwtValue(options.$resolveConfig.jwtCookie, arg, res)
    Object.assign(
      res,
      redirect(
        getRootBasedUrl(
          options.$resolveConfig.rootPath,
          options.successRedirect || '/'
        )
      )
    )
  },
  fail: async (options, req, res, next, error, status) => {
    if (options.failureRedirect) {
      Object.assign(
        res,
        redirect(
          getRootBasedUrl(
            options.$resolveConfig.rootPath,
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
            options.$resolveConfig.rootPath,
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
