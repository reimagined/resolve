import type { Server } from 'http'
import type { Response as FetchResponse } from 'node-fetch'
import http from 'http'
import fetch from 'node-fetch'
import { URL } from 'url'
import { stringify as stringifyQuery } from 'query-string'
import { format as prettify } from 'prettier'
import getRawBody from 'raw-body'

import type {
  HttpRequest,
  HttpResponse,
  HttpMethods,
  LambdaOriginEdgeRequest,
} from '../src/types'
import wrapHttpServerApiHandler from '../src/http-server/wrap-api-handler'
import wrapLambdaServerApiHandler from '../src/aws-lambda-origin-edge/wrap-api-handler'

jest.setTimeout(1000 * 60)

const customApi = {
  resolve: {
    executeCommand: jest.fn(),
    executeQuery: jest.fn(),
    bootstrap: jest.fn(),
  },
}

const tests: Array<{
  route: {
    path: string
    method: HttpMethods
    handler: (
      req: HttpRequest<typeof customApi>,
      res: HttpResponse
    ) => Promise<void>
  }
  request: {
    query?: string
    body?: string
    headers?: Record<string, string>
  }
  test: (response: FetchResponse) => Promise<void>
}> = [
  {
    route: {
      path: '/json-handler',
      method: 'GET',
      handler: async (req, res) => {
        res.json({ a: 42, b: 'アニメの女の子' })
      },
    },
    request: {},
    test: async (response) => {
      const result = await response.json()
      expect(result).toEqual({ a: 42, b: 'アニメの女の子' })
      expect(response.status).toEqual(200)
    },
  },
  {
    route: {
      path: '/text-handler',
      method: 'GET',
      handler: async (req, res) => {
        res.end('アニメの女の子')
      },
    },
    request: {},
    test: async (response) => {
      const result = await response.text()
      expect(result).toEqual('アニメの女の子')
      expect(response.status).toEqual(200)
    },
  },
  {
    route: {
      path: '/redirect-302-handler',
      method: 'GET',
      handler: async (req, res) => {
        res.redirect('/redirected')
      },
    },
    request: {},
    test: async (response) => {
      expect(response.headers.get('Location')).toContain('/redirected')
      expect(response.status).toEqual(302)
    },
  },
  {
    route: {
      path: '/redirect-301-handler',
      method: 'GET',
      handler: async (req, res) => {
        res.redirect('/redirected', 301)
      },
    },
    request: {},
    test: async (response) => {
      expect(response.headers.get('Location')).toContain('/redirected')
      expect(response.status).toEqual(301)
    },
  },
  {
    route: {
      path: '/access-denied',
      method: 'GET',
      handler: async (req, res) => {
        res.status(401)
        res.end('Access denied')
      },
    },
    request: {},
    test: async (response) => {
      const result = await response.text()
      expect(result).toEqual('Access denied')
      expect(response.status).toEqual(401)
    },
  },
  {
    route: {
      path: '/unhandled-error-handler',
      method: 'GET',
      handler: async (req, res) => {
        class CustomError extends Error {
          name = 'CustomError'
        }
        throw new CustomError('Unhandled error')
      },
    },
    request: {},
    test: async (response) => {
      const result = await response.text()
      expect(result).toEqual('CustomError: Unhandled error')
      expect(response.status).toEqual(500)
    },
  },
  {
    route: {
      path: '/commands',
      method: 'POST',
      handler: async (req, res) => {
        await req.resolve.executeQuery()
        await req.resolve.executeCommand()
        res.json({
          aggregateVersion: 1,
          payload: req.body == null ? {} : JSON.parse(req.body.toString()),
        })
      },
    },
    request: {
      body: JSON.stringify({ type: 'Test' }),
    },
    test: async (response) => {
      const result = await response.json()
      expect(result).toEqual({
        aggregateVersion: 1,
        payload: { type: 'Test' },
      })
      expect(response.status).toEqual(200)
      expect(customApi.resolve.executeQuery).toHaveBeenCalled()
      expect(customApi.resolve.executeCommand).toHaveBeenCalled()
    },
  },

  {
    route: {
      path: '/bootstrap',
      method: 'PATCH',
      handler: async (req, res) => {
        await req.resolve.bootstrap()
        res.end()
      },
    },
    request: {},
    test: async (response) => {
      const result = await response.text()
      expect(result).toEqual('')
      expect(response.status).toEqual(200)
      expect(customApi.resolve.bootstrap).toHaveBeenCalled()
    },
  },
  {
    route: {
      path: '/sum',
      method: 'POST',
      handler: async (req, res) => {
        const { a, b } =
          req.body == null
            ? { a: 0, b: 0 }
            : JSON.parse(req.body.toString() ?? '{}')
        res.json({
          a,
          b,
          c: a + b,
        })
      },
    },
    request: {
      body: JSON.stringify({ a: 5, b: 10 }),
    },
    test: async (response) => {
      const result = await response.json()
      expect(result).toEqual({
        a: 5,
        b: 10,
        c: 15,
      })
      expect(response.status).toEqual(200)
    },
  },
  {
    route: {
      path: '/sum',
      method: 'GET',
      handler: async (req, res) => {
        const { a, b } = req.query
        res.json({
          a: +a,
          b: +b,
          c: +a + +b,
        })
      },
    },
    request: {
      query: stringifyQuery({ a: 5, b: 10 }, { arrayFormat: 'bracket' }),
    },
    test: async (response) => {
      const result = await response.json()
      expect(result).toEqual({
        a: 5,
        b: 10,
        c: 15,
      })
      expect(response.status).toEqual(200)
    },
  },
  {
    route: {
      path: '/avg',
      method: 'GET',
      handler: async (req, res) => {
        const { arr } = req.query
        res.json(
          arr.reduce((acc: number, val: string) => acc + +val, 0) / arr.length
        )
      },
    },
    request: {
      query: stringifyQuery(
        { arr: [1, 1, 1, 3, 3, 3] },
        { arrayFormat: 'bracket' }
      ),
    },
    test: async (response) => {
      const result = await response.json()
      expect(result).toEqual(2)
      expect(response.status).toEqual(200)
    },
  },
]

let localHttpServer: Server
let localHttpServerBaseUrl: string
let lambdaServer: Server
let lambdaServerBaseUrl: string
beforeAll(async () => {
  {
    localHttpServer = await new Promise((resolve) => {
      const refServer = http
        .createServer(async (req, res) => {
          for (const {
            route: { path, method, handler },
          } of tests) {
            const url = new URL(req.url ?? '', 'https://example.com')
            if (url.pathname === path && req.method === method) {
              await wrapHttpServerApiHandler(handler, () => customApi)(req, res)
              return
            }
          }
          res.statusCode = 500
          res.end()
        })
        .listen(0, () => {
          resolve(refServer)
        })
    })

    const localHttpServerAddress = localHttpServer.address()
    if (
      localHttpServerAddress == null ||
      typeof localHttpServerAddress === 'string'
    ) {
      throw new TypeError()
    }

    localHttpServerBaseUrl = `http://localhost:${localHttpServerAddress.port}`
  }
  {
    lambdaServer = await new Promise((resolve) => {
      const refServer = http
        .createServer(async (req, res) => {
          for (const {
            route: { path, method, handler },
          } of tests) {
            const url = new URL(req.url ?? '', 'https://example.com')
            if (url.pathname === path && req.method === method) {
              const contentLength =
                req.headers['Content-Length'] == null
                  ? null
                  : +req.headers['Content-Length']
              const lambdaEvent: LambdaOriginEdgeRequest = {
                requestStartTime: Date.now(),
                headers: Object.entries(req.headers).map(([key, value]) => ({
                  key,
                  value,
                })),
                body:
                  contentLength == null
                    ? null
                    : (
                        await getRawBody(req, {
                          length: contentLength,
                        })
                      ).toString('base64'),
                uri: url.pathname,
                httpMethod: req.method,
                querystring: url.search.replace(/^?/, ''),
              }
              const lambdaOriginEdgeResponse = await wrapLambdaServerApiHandler(
                handler,
                () => customApi
              )(lambdaEvent, {})
              res.statusCode = lambdaOriginEdgeResponse.httpStatus
              for (const { key, value } of lambdaOriginEdgeResponse.headers) {
                // TODO check Many Set-cookie:
                res.setHeader(key, value)
              }
              res.end(
                Buffer.from(lambdaOriginEdgeResponse.body).toString('base64')
              )
              return
            }
          }
          res.statusCode = 500
          res.end()
        })
        .listen(0, () => {
          resolve(refServer)
        })
    })

    const lambdaServerAddress = localHttpServer.address()
    if (
      lambdaServerAddress == null ||
      typeof lambdaServerAddress === 'string'
    ) {
      throw new TypeError()
    }

    lambdaServerBaseUrl = `http://localhost:${lambdaServerAddress.port}`
  }
})

afterAll(async () => {
  await Promise.all(
    [localHttpServer, lambdaServer].map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error != null) {
              reject(error)
            } else {
              resolve()
            }
          })
        })
    )
  )
})

const clearMocks = () => {
  customApi.resolve.executeCommand.mockClear()
  customApi.resolve.executeQuery.mockClear()
  customApi.resolve.bootstrap.mockClear()
}

for (const {
  route: { path: pathname, method },
  request,
  test: runTest,
} of tests) {
  const { query, headers, body } = request
  const path = `${pathname}${query != null ? `?${query}` : ''}`

  test(`Request ${path} ${JSON.stringify(
    request
  )} should work correctly\n${prettify(runTest.toString(), {
    parser: 'typescript',
    semi: true,
    trailingComma: 'none',
  })}`, async () => {
    {
      clearMocks()
      const localHttpServerResponse = await fetch(
        `${localHttpServerBaseUrl}${path}`,
        {
          method,
          body,
          headers,
          redirect: 'manual',
        }
      )
      await runTest(localHttpServerResponse)
    }
    {
      clearMocks()
      const lambdaServerResponse = await fetch(
        `${lambdaServerBaseUrl}${path}`,
        {
          method,
          body,
          headers,
          redirect: 'manual',
        }
      )
      await runTest(lambdaServerResponse)
    }
  })
}
