import type { HttpRequest, HttpResponse, CORS } from './types'

const createCorsMiddleware = <
  CustomParameters extends Record<string | symbol, any> = {}
>(
  cors: CORS
) => {
  if (Object.keys(cors).length === 0) {
    return null
  }
  return (
    req: HttpRequest<CustomParameters>,
    res: HttpResponse,
    next: () => void
  ): void => {
    const { origin: corsOrigin } = cors
    const { origin: headerOrigin } = req.headers

    if (
      corsOrigin === '*' ||
      (corsOrigin?.constructor === String && corsOrigin === headerOrigin)
    ) {
      res.setHeader('Access-Control-Allow-Origin', corsOrigin)
    } else if (
      (headerOrigin != null && corsOrigin === true) ||
      (Array.isArray(corsOrigin) &&
        corsOrigin.every((item) => item?.constructor === String) &&
        headerOrigin != null &&
        corsOrigin.includes(headerOrigin)) ||
      (corsOrigin != null &&
        corsOrigin.constructor === RegExp &&
        headerOrigin != null &&
        corsOrigin.test(headerOrigin))
    ) {
      res.setHeader('Access-Control-Allow-Origin', headerOrigin)
      res.addVaryHeader('Origin')
    } else {
      next()
      return
    }

    res.setHeader('Access-Control-Allow-Methods', '*')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, Content-Type, Accept, x-resolve-execution-mode'
    )
    next()
  }
}

export default createCorsMiddleware
