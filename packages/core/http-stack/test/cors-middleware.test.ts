import type { HttpRequest, HttpResponse } from '../src/types'
import createCorsMiddleware from '../src/create-cors-middleware'
import createResponse from '../src/create-response'
import finalizeResponse from '../src/finalize-response'

describe('method "createCorsMiddleware"', () => {
  let req: HttpRequest
  let res: HttpResponse

  beforeEach(() => {
    req = {
      headers: {
        Origin: 'example.com',
      },
      body: Buffer.from(''),
      method: 'GET',
      cookies: {},
      path: '/',
      query: {},
      params: {},
      clientIp: undefined,
    }
    res = createResponse()
  })

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

    expect(finalizeResponse(res).headers).toEqual([
      {key: 'Access-Control-Allow-Origin', value: req.headers.origin}
    ])
  })
})
