import type { HttpRequest, HttpResponse, HttpMethods } from '../src/'
import {
  ORIGIN,
  VARY,
  ACCESS_CONTROL_ALLOW_ORIGIN,
  ACCESS_CONTROL_ALLOW_METHODS,
  INTERNAL,
} from '../src/constants'
import createCorsMiddleware from '../src/create-cors-middleware'
import createResponse from '../src/create-response'
import finalizeResponse from '../src/finalize-response'
import wrapHeadersCaseInsensitive from '../src/wrap-headers-case-insensitive'
import normalizeKey from '../src/normalize-key'

describe('method "createCorsMiddleware"', () => {
  let req: HttpRequest
  let res: HttpResponse

  const regenerateRequestResponse = ({
    headers = {
      [ORIGIN]: 'example.com',
    },
    method = 'GET',
  }: { headers?: Record<string, string>; method?: HttpMethods } = {}) => {
    req = {
      headers: wrapHeadersCaseInsensitive(headers),
      rawBody: Buffer.from(''),
      body: {},
      method,
      cookies: {},
      path: '/',
      rawQuery: undefined,
      query: {},
      params: {},
      clientIp: undefined,
      requestStartTime: Date.now(),
    }
    res = createResponse()
  }

  beforeEach(() => regenerateRequestResponse())

  test('should return null when empty options', async () => {
    const corsMiddleware = createCorsMiddleware({})

    expect(corsMiddleware).toEqual(null)
  })

  test('should return null when origin=false', async () => {
    const corsMiddleware = createCorsMiddleware({
      origin: false,
    })

    expect(corsMiddleware).toEqual(null)
  })

  test('should reflect the request origin', async () => {
    const corsMiddleware = createCorsMiddleware({
      origin: true,
    })

    if (corsMiddleware == null) {
      throw new TypeError()
    }

    // eslint-disable-next-line no-new-func
    corsMiddleware(req, res, Function() as any)

    expect(Object.fromEntries(finalizeResponse(res).headers)).toEqual({
      [normalizeKey(
        ACCESS_CONTROL_ALLOW_ORIGIN,
        'upper-dash-case'
      )]: 'example.com',
      [normalizeKey(ACCESS_CONTROL_ALLOW_METHODS, 'upper-dash-case')]: '*',
      [normalizeKey(VARY, 'upper-dash-case')]: 'Origin',
    })
    expect(res[INTERNAL].status).toEqual(200)
  })

  test('should do nothing', async () => {
    const corsMiddleware = createCorsMiddleware({
      origin: 'specified.example.com',
    })

    if (corsMiddleware == null) {
      throw new TypeError()
    }

    // eslint-disable-next-line no-new-func
    corsMiddleware(req, res, Function() as any)

    expect(Object.fromEntries(finalizeResponse(res).headers)).toEqual({})
    expect(res[INTERNAL].status).toEqual(200)
  })

  test('should return a specific origin', async () => {
    const corsMiddleware = createCorsMiddleware({
      origin: 'specified.example.com',
    })

    if (corsMiddleware == null) {
      throw new TypeError()
    }

    regenerateRequestResponse({
      headers: {
        [ORIGIN]: 'specified.example.com',
      },
    })

    // eslint-disable-next-line no-new-func
    corsMiddleware(req, res, Function() as any)

    expect(Object.fromEntries(finalizeResponse(res).headers)).toEqual({
      [normalizeKey(
        ACCESS_CONTROL_ALLOW_ORIGIN,
        'upper-dash-case'
      )]: 'specified.example.com',
      [normalizeKey(ACCESS_CONTROL_ALLOW_METHODS, 'upper-dash-case')]: '*',
      [normalizeKey(VARY, 'upper-dash-case')]: 'Origin',
    })
    expect(res[INTERNAL].status).toEqual(200)
  })

  test('should return one of a specific origins', async () => {
    const corsMiddleware = createCorsMiddleware({
      origin: ['a.example.com', 'b.example.com'],
    })

    if (corsMiddleware == null) {
      throw new TypeError()
    }

    // a.example.com

    regenerateRequestResponse({
      headers: {
        [ORIGIN]: 'a.example.com',
      },
    })

    // eslint-disable-next-line no-new-func
    corsMiddleware(req, res, Function() as any)

    expect(Object.fromEntries(finalizeResponse(res).headers)).toEqual({
      [normalizeKey(
        ACCESS_CONTROL_ALLOW_ORIGIN,
        'upper-dash-case'
      )]: 'a.example.com',
      [normalizeKey(ACCESS_CONTROL_ALLOW_METHODS, 'upper-dash-case')]: '*',
      [normalizeKey(VARY, 'upper-dash-case')]: 'Origin',
    })
    expect(res[INTERNAL].status).toEqual(200)

    // b.example.com

    regenerateRequestResponse({
      headers: {
        [ORIGIN]: 'b.example.com',
      },
    })

    // eslint-disable-next-line no-new-func
    corsMiddleware(req, res, Function() as any)

    expect(Object.fromEntries(finalizeResponse(res).headers)).toEqual({
      [normalizeKey(
        ACCESS_CONTROL_ALLOW_ORIGIN,
        'upper-dash-case'
      )]: 'b.example.com',
      [normalizeKey(ACCESS_CONTROL_ALLOW_METHODS, 'upper-dash-case')]: '*',
      [normalizeKey(VARY, 'upper-dash-case')]: 'Origin',
    })
    expect(res[INTERNAL].status).toEqual(200)

    // c.example.com

    regenerateRequestResponse({
      headers: {
        [ORIGIN]: 'c.example.com',
      },
    })

    // eslint-disable-next-line no-new-func
    corsMiddleware(req, res, Function() as any)

    expect(Object.fromEntries(finalizeResponse(res).headers)).toEqual({})
    expect(res[INTERNAL].status).toEqual(200)
  })

  test('should return status=204 when method=OPTIONS, status=200 when method=GET', async () => {
    const corsMiddleware = createCorsMiddleware({
      origin: true,
      optionsSuccessStatus: 204,
    })

    if (corsMiddleware == null) {
      throw new TypeError()
    }

    // OPTIONS 204

    regenerateRequestResponse({
      method: 'OPTIONS',
    })

    // eslint-disable-next-line no-new-func
    corsMiddleware(req, res, Function() as any)

    expect(Object.fromEntries(finalizeResponse(res).headers)).toEqual({
      [normalizeKey(
        ACCESS_CONTROL_ALLOW_ORIGIN,
        'upper-dash-case'
      )]: 'example.com',
      [normalizeKey(ACCESS_CONTROL_ALLOW_METHODS, 'upper-dash-case')]: '*',
      [normalizeKey(VARY, 'upper-dash-case')]: 'Origin',
    })
    expect(res[INTERNAL].status).toEqual(204)

    // GET 200

    regenerateRequestResponse({
      method: 'GET',
    })

    // eslint-disable-next-line no-new-func
    corsMiddleware(req, res, Function() as any)

    expect(Object.fromEntries(finalizeResponse(res).headers)).toEqual({
      [normalizeKey(
        ACCESS_CONTROL_ALLOW_ORIGIN,
        'upper-dash-case'
      )]: 'example.com',
      [normalizeKey(ACCESS_CONTROL_ALLOW_METHODS, 'upper-dash-case')]: '*',
      [normalizeKey(VARY, 'upper-dash-case')]: 'Origin',
    })
    expect(res[INTERNAL].status).toEqual(200)
  })
})
