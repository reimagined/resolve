import type { HttpRequest, HttpResponse, CORS } from './types'

const createCorsMiddleware = <
  CustomParameters extends Record<string | symbol, any> = {}
>(
  cors: CORS
) => {
  if (cors.origin === false || Object.keys(cors).length === 0) {
    return null
  }
  return (
    req: HttpRequest<CustomParameters>,
    res: HttpResponse,
    next: () => void
  ): void => {
    const {
      origin: corsOrigin,
      methods = '*',
      allowedHeaders = req.headers['Access-Control-Request-Headers'],
      exposedHeaders,
      optionsSuccessStatus = 204,
      maxAge,
      credentials,
    } = cors
    const headerOrigin = req.headers['Origin']

    if (
      corsOrigin === '*' ||
      (corsOrigin?.constructor === String && corsOrigin === headerOrigin)
    ) {
      res.setHeader('Access-Control-Allow-Origin', corsOrigin)
    } else if (
      (headerOrigin != null && corsOrigin === true) ||
      (headerOrigin != null &&
        Array.isArray(corsOrigin) &&
        corsOrigin.every((item) => item?.constructor === String) &&
        corsOrigin.includes(headerOrigin)) ||
      (corsOrigin?.constructor === RegExp &&
        headerOrigin != null &&
        corsOrigin.test(headerOrigin))
    ) {
      res.setHeader('Access-Control-Allow-Origin', headerOrigin)
      res.addVaryHeader('Origin')
    } else {
      next()
      return
    }

    res.setHeader(
      'Access-Control-Allow-Methods',
      Array.isArray(methods) ? methods.join(',') : methods
    )

    if (allowedHeaders != null) {
      res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(','))
    }
    if (exposedHeaders != null) {
      res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(','))
    }
    if (maxAge != null) {
      res.setHeader('Access-Control-Max-Age', `${maxAge}`)
    }
    if (credentials === true) {
      res.setHeader('Access-Control-Allow-Credentials', 'true')
    }
    res.status(optionsSuccessStatus)
    next()
  }
}

export default createCorsMiddleware
