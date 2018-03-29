export default (authReq, authRes, next) => ({
  onSuccess: (options, user) => {
    authRes.applyJwtValue(user, authRes.expressRes, options.successRedirect)
  },
  onFail: options => {
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
  onPass: () => {
    next()
  },
  onError: (options, err) => {
    next(err)
  }
})
