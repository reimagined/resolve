export default (getRootBasedUrl, authReq, authRes, next) => ({
  onSuccess: (options, user /*, info*/) => {
    authRes.applyJwtValue(
      user,
      authRes.expressRes,
      getRootBasedUrl(options.successRedirect || '/')
    )
  },
  onFail: (options, error, status) => {
    const res = authRes.expressRes
    if (options.failureRedirect) {
      // eslint-disable-next-line
      console.warn(error)
      res.statusCode = 302
      res.setHeader(
        'Location',
        getRootBasedUrl(
          typeof options.failureRedirect === 'function'
            ? options.failureRedirect(error)
            : options.failureRedirect
        )
      )
      res.setHeader('Content-Length', '0')
      res.end()
    } else {
      res.statusCode = status || 401
      res.end(JSON.stringify(error))
    }
  },
  onRedirect: (options, url, status) => {
    const res = authRes.expressRes
    res.statusCode = status || 302
    res.setHeader('Location', getRootBasedUrl(url))
    res.setHeader('Content-Length', '0')
    res.end()
  },
  onPass: /*options*/ () => {
    next()
  },
  onError: (options, err) => {
    const res = authRes.expressRes
    if (options.errorRedirect) {
      // eslint-disable-next-line
      console.warn(err)
      res.statusCode = 302
      res.setHeader(
        'Location',
        getRootBasedUrl(
          typeof options.errorRedirect === 'function'
            ? options.errorRedirect(err)
            : options.errorRedirect
        )
      )
      res.setHeader('Content-Length', '0')
      res.end()
    } else {
      next(err)
    }
  }
})
