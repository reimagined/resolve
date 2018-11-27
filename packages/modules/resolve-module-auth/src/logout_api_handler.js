import wrapAuthRequest from './wrap_auth_request'

const logoutApiHandler = async (req, res) => {
  try {
    const authRequest = wrapAuthRequest(req)
    const { jwtCookie, rootPath } = authRequest.resolve

    res.cookie(jwtCookie.name, '', {
      expires: new Date(0),
      path: `/${rootPath}`
    })
    res.setHeader('Authorization', '')
    res.setHeader('X-JWT', '')

    const noredirect =
      (authRequest.body &&
        authRequest.body.noredirect &&
        String(authRequest.body.noredirect) === 'true') ||
      (authRequest.query &&
        authRequest.query.noredirect &&
        String(authRequest.query.noredirect) === 'true')

    if (noredirect) {
      res.status(200)
      res.end('OK')
      return
    }

    const referer = authRequest.headers['referer']
    if (referer != null) {
      res.redirect(referer)
      return
    }

    res.redirect(`/${rootPath}`)
  } catch (error) {
    res.status(504)

    const outError =
      error != null && error.stack != null
        ? `${error.stack}`
        : `Unknown error ${error}`

    res.end(outError)
  }
}

export default logoutApiHandler
