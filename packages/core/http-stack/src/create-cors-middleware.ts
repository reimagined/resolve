import type { HttpRequest, HttpResponse, CORS } from './types'
import {
  ORIGIN,
  ACCESS_CONTROL_REQUEST_HEADERS,
  ACCESS_CONTROL_ALLOW_ORIGIN,
  ACCESS_CONTROL_ALLOW_METHODS,
  ACCESS_CONTROL_ALLOW_HEADERS,
  ACCESS_CONTROL_EXPOSE_HEADERS,
  ACCESS_CONTROL_MAX_AGE,
  ACCESS_CONTROL_ALLOW_CREDENTIALS,
} from './constants'

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
    const accessControlRequestHeaders =
      req.headers[ACCESS_CONTROL_REQUEST_HEADERS]
    const {
      origin: corsOrigin,
      methods = '*',
      allowedHeaders = accessControlRequestHeaders == null
        ? undefined
        : accessControlRequestHeaders.split(',').map((key) => key.trim()),
      exposedHeaders,
      optionsSuccessStatus = 200,
      maxAge,
      credentials,
    } = cors
    const headerOrigin = req.headers[ORIGIN]

    if (corsOrigin === '*') {
      res.setHeader(ACCESS_CONTROL_ALLOW_ORIGIN, '*')
    } else if (
      corsOrigin?.constructor === String &&
      corsOrigin === headerOrigin
    ) {
      res.setHeader(ACCESS_CONTROL_ALLOW_ORIGIN, corsOrigin)
      res.addVaryHeader(ORIGIN)
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
      res.setHeader(ACCESS_CONTROL_ALLOW_ORIGIN, headerOrigin)
      res.addVaryHeader(ORIGIN)
    } else {
      next()
      return
    }

    res.setHeader(
      ACCESS_CONTROL_ALLOW_METHODS,
      Array.isArray(methods) ? methods.join(',') : methods
    )

    if (allowedHeaders != null) {
      res.setHeader(ACCESS_CONTROL_ALLOW_HEADERS, allowedHeaders.join(','))
    }
    if (exposedHeaders != null) {
      res.setHeader(ACCESS_CONTROL_EXPOSE_HEADERS, exposedHeaders.join(','))
    }
    if (maxAge != null) {
      res.setHeader(ACCESS_CONTROL_MAX_AGE, `${maxAge}`)
    }
    if (credentials === true) {
      res.setHeader(ACCESS_CONTROL_ALLOW_CREDENTIALS, 'true')
    }

    if (req.method === 'OPTIONS') {
      res.status(optionsSuccessStatus)
    }
    next()
  }
}

export default createCorsMiddleware
