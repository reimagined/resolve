import invokeDomain from './invoke_domain'

const wrapAuthRequest = req => {
  const authRequest = {
    ...req,
    resolve: {
      ...(req.resolve == null
        ? { rootPath: '', jwtCookie: { name: 'jwt', maxAge: 31536000000 } }
        : req.resolve)
    }
  }

  // TODO: Protocol, host and port should be retrieved from config in explicit manner
  const baseApiUrl = `http://${authRequest.headers.host}${
    authRequest.resolve.rootPath
  }/api`

  const jwtToken = authRequest.cookies[authRequest.resolve.jwtCookie.name]

  Object.assign(authRequest.resolve, {
    executeQuery: invokeDomain.bind(null, `${baseApiUrl}/query`, jwtToken),
    executeCommand: invokeDomain.bind(null, `${baseApiUrl}/commands`, jwtToken)
  })

  // TODO: use string-based body parsers (not stream-based like npm body-parser)
  if (authRequest.body != null && authRequest.headers['content-type'] != null) {
    const bodyContentType = authRequest.headers['content-type'].toLowerCase()

    switch (bodyContentType) {
      case 'application/x-www-form-urlencoded': {
        authRequest.body = authRequest.body.split('&').reduce((acc, part) => {
          const [key, ...value] = part.split('=')
          acc[decodeURIComponent(key)] = decodeURIComponent(value.join('='))
          return acc
        }, {})
        break
      }

      case 'application/json': {
        authRequest.body = JSON.parse(authRequest.body)
        break
      }

      default: {
        throw new Error(`Invalid request body Content-type: ${bodyContentType}`)
      }
    }
  }

  return authRequest
}

export default wrapAuthRequest
