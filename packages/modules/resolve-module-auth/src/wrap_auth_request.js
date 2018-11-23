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

  const authRequest = Object.create(req, {
    resolve: {
      value: Object.create(req.resolve, {
        executeCommand: {
          value: wrapDefaultJwt(req.resolve.executeCommand, jwtToken),
          enumerable: true,
          configurable: true,
          writable: true
        },
        executeQuery: {
          value: wrapDefaultJwt(req.resolve.executeQuery, jwtToken),
          enumerable: true,
          configurable: true,
          writable: true
        }
      }),
      enumerable: true,
      configurable: true,
      writable: true
    },
    body: {
      value: null,
      enumerable: true,
      configurable: true,
      writable: true
    }
  })

  // TODO: use string-based body parsers (not stream-based like npm body-parser)
  if (req.body != null && req.headers['content-type'] != null) {
    const bodyContentType = (req.headers['content-type'].toLowerCase().split(';'))[0].trim()

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
