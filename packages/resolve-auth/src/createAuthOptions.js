import { getRootableUrl } from './helpers'

export default (authReq, authRes, next) => ({
  onSuccess: (options, user /*, info*/) => {
    authRes.applyJwtValue(
      user,
      authRes.expressRes,
      getRootableUrl(options.successRedirect || '/')
    )
  },
  onFail: (options, error, status) => {
    const res = authRes.expressRes
    if (options.failureRedirect) {
      // eslint-disable-next-line
      console.warn(error)
      res.statusCode = 302
      res.setHeader('Location', getRootableUrl(options.failureRedirect))
      res.setHeader('Content-Length', '0')
      res.end()
    } else {
      res.statusCode = status
      res.end(JSON.stringify(error))
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
