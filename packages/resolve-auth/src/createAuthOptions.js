export default (authReq, authRes, next) => ({
  onSuccess: (options, user /*, info*/) => {
    authRes.applyJwtValue(user, authRes.expressRes, options.successRedirect)
  },
  onFail: (options /*, challenge , status*/) => {
    if (options.failureRedirect) {
      const res = authRes.expressRes
      res.statusCode = 302
      res.setHeader('Location', options.failureRedirect)
      res.setHeader('Content-Length', '0')
      res.end()
    }
  },
  onRedirect: (options, url, status) => {
    const res = authRes.expressRes
    res.statusCode = status || 302
    res.setHeader('Location', url)
    res.setHeader('Content-Length', '0')
    res.end()
  },
  onPass: /*options*/ () => {
    next()
  },
  onError: (options, err) => {
    next(err)
  }
})
