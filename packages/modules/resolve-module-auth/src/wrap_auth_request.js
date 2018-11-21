const wrapDefaultJwt = (executor, defaultJwtToken) => async ({
  jwtToken,
  ...args
}) =>
  await executor({
    jwtToken: jwtToken != null ? jwtToken : defaultJwtToken,
    ...args
  })

const wrapAuthRequest = req => {
  const jwtToken = req.cookies[req.resolve.jwtCookie.name]

  const authRequest = {
    ...req,
    resolve: {
      ...req.resolve,
      executeCommand: wrapDefaultJwt(req.resolve.executeCommand, jwtToken),
      executeQuery: wrapDefaultJwt(req.resolve.executeQuery, jwtToken)
    }
  }

  Object.setPrototypeOf(authRequest, Object.getPrototypeOf(req))
  Object.setPrototypeOf(authRequest.resolve, Object.getPrototypeOf(req.resolve))

  // TODO: use string-based body parsers (not stream-based like npm body-parser)
  if (req.body != null && req.headers['content-type'] != null) {
    const bodyContentType = req.headers['content-type'].toLowerCase()

    switch (bodyContentType) {
      case 'application/x-www-form-urlencoded': {
        authRequest.body = req.body.split('&').reduce((acc, part) => {
          const [key, ...value] = part.split('=')
          acc[decodeURIComponent(key)] = decodeURIComponent(value.join('='))
          return acc
        }, {})
        break
      }

      case 'application/json': {
        authRequest.body = JSON.parse(req.body)
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
