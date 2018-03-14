export default (authReq, authRes, next) => ({
  onSuccess: (options, user, info) => {
    options.onSuccess(user, {
      // TODO: use applyJwtValue
      setCookie: (name, value, options) => authRes.cookie(name, value, options)
    })
    authRes.expressRes.set('Content-Type', 'application/json')
    authRes.expressRes.status(200)
    next()
  },
  onFail: (options, challenge, status) => {
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
  onPass: options => {
    next()
  },
  onError: (options, err) => {
    next(err)
  }
})
