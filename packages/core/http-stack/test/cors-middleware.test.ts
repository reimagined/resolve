import type { HttpRequest, HttpResponse } from '../src/types'
import createCorsMiddleware from '../src/create-cors-middleware'
import createResponse from '../src/create-response'
import finalizeResponse from '../src/finalize-response'

describe('', () => {
  const req: HttpRequest = {
    headers: {},
    body: Buffer.from(''),
    method: 'GET',
    cookies: {},
    path: '/',
    query: {},
    params: {},
    clientIp: undefined,
  }
  const res: HttpResponse = createResponse()

  test('', async () => {
    const corsMiddleware = createCorsMiddleware({
      origin: true,
    })

    if (corsMiddleware == null) {
      throw new TypeError()
    }

    // eslint-disable-next-line no-new-func
    corsMiddleware(req, res, Function() as any)

    expect(finalizeResponse(res).headers).toEqual([])
  })
})
