import type { Server } from 'http'
import type { Response as FetchResponse } from 'node-fetch'
import http from 'http'
import fetch from 'node-fetch'
import { URL } from 'url'
import { stringify as stringifyQuery } from 'query-string'
import { format as prettify } from 'prettier'
import getRawBody from 'raw-body'
import FormData from 'form-data'

import type { HttpMethods, Route, LambdaOriginEdgeRequest, CORS } from '../src'
import { HttpServer, AWSLambdaOriginEdge } from '../src'
import RouterConfigBuilder from '../src/router-config-builder'
import parseMultipartData from '../src/parse-multipart-data'
import parseUrlencoded from '../src/parse-urlencoded'

jest.setTimeout(1000 * 60)

const customApi = {
  resolve: {
    executeCommand: jest.fn(),
    executeQuery: jest.fn(),
    bootstrap: jest.fn(),
  },
}

const tests: Array<{
  route: Route<typeof customApi>
  tests: Array<{
    request: {
      query?: string
      body?: string | Buffer
      headers?: Record<string, string>
    }
    accept: (response: FetchResponse) => Promise<void>
  }>
}> = [
  {
    route: {
      pattern: '/json-handler',
      method: 'GET',
      handler: async (req, res) => {
        res.json({ a: 42, b: 'アニメの女の子' })
      },
    },
    tests: [
      {
        request: {},
        accept: async (response) => {
          const result = await response.json()
          expect(result).toEqual({ a: 42, b: 'アニメの女の子' })
          expect(response.status).toEqual(200)
        },
      },
    ],
  },
  {
    route: {
      pattern: '/text-handler',
      method: 'GET',
      handler: async (req, res) => {
        res.end('アニメの女の子')
      },
    },
    tests: [
      {
        request: {},
        accept: async (response) => {
          const result = await response.text()
          expect(result).toEqual('アニメの女の子')
          expect(response.status).toEqual(200)
        },
      },
    ],
  },
  {
    route: {
      pattern: '/redirect-302-handler',
      method: 'GET',
      handler: async (req, res) => {
        res.redirect('/redirected')
      },
    },
    tests: [
      {
        request: {},
        accept: async (response) => {
          expect(response.headers.get('Location')).toContain('/redirected')
          expect(response.status).toEqual(302)
        },
      },
    ],
  },
  {
    route: {
      pattern: '/redirect-301-handler',
      method: 'GET',
      handler: async (req, res) => {
        res.redirect('/redirected', 301)
      },
    },
    tests: [
      {
        request: {},
        accept: async (response) => {
          expect(response.headers.get('Location')).toContain('/redirected')
          expect(response.status).toEqual(301)
        },
      },
    ],
  },
  {
    route: {
      pattern: '/access-denied',
      method: 'GET',
      handler: async (req, res) => {
        res.status(401)
        res.end('Access denied')
      },
    },
    tests: [
      {
        request: {},
        accept: async (response) => {
          const result = await response.text()
          expect(result).toEqual('Access denied')
          expect(response.status).toEqual(401)
        },
      },
    ],
  },
  {
    route: {
      pattern: '/unhandled-error-handler',
      method: 'GET',
      handler: async () => {
        class CustomError extends Error {
          name = 'CustomError'
        }
        throw new CustomError('Unhandled error')
      },
    },
    tests: [
      {
        request: {},
        accept: async (response) => {
          const result = await response.text()
          expect(result).toEqual('CustomError: Unhandled error')
          expect(response.status).toEqual(500)
        },
      },
    ],
  },
  {
    route: {
      pattern: '/commands',
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
    tests: [
      {
        request: {
          body: JSON.stringify({ type: 'Test' }),
        },
        accept: async (response) => {
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
    ],
  },

  {
    route: {
      pattern: '/bootstrap',
      method: 'PATCH',
      handler: async (req, res) => {
        await req.resolve.bootstrap()
        res.end()
      },
    },
    tests: [
      {
        request: {},
        accept: async (response) => {
          const result = await response.text()
          expect(result).toEqual('')
          expect(response.status).toEqual(200)
          expect(customApi.resolve.bootstrap).toHaveBeenCalled()
        },
      },
    ],
  },
  {
    route: {
      pattern: '/sum',
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
    tests: [
      {
        request: {
          body: JSON.stringify({ a: 5, b: 10 }),
        },
        accept: async (response) => {
          const result = await response.json()
          expect(result).toEqual({
            a: 5,
            b: 10,
            c: 15,
          })
          expect(response.status).toEqual(200)
        },
      },
    ],
  },
  {
    route: {
      pattern: '/sum',
      method: 'GET',
      handler: async (req, res) => {
        const { a = 0, b = 0 } = req.query
        res.json({
          a: +a,
          b: +b,
          c: +a + +b,
        })
      },
    },
    tests: [
      {
        request: {
          query: stringifyQuery({ a: 5, b: 10 }, { arrayFormat: 'bracket' }),
        },
        accept: async (response) => {
          const result = await response.json()
          expect(result).toEqual({
            a: 5,
            b: 10,
            c: 15,
          })
          expect(response.status).toEqual(200)
        },
      },
    ],
  },
  {
    route: {
      pattern: '/avg',
      method: 'GET',
      handler: async (req, res) => {
        const { arr } = req.query
        res.json(
          Array.isArray(arr)
            ? arr.reduce((acc: number, val: string) => acc + +val, 0) /
                arr.length
            : []
        )
      },
    },
    tests: [
      {
        request: {
          query: stringifyQuery(
            { arr: [1, 1, 1, 3, 3, 3] },
            { arrayFormat: 'bracket' }
          ),
        },
        accept: async (response) => {
          const result = await response.json()
          expect(result).toEqual(2)
          expect(response.status).toEqual(200)
        },
      },
    ],
  },
  {
    route: {
      pattern: '/access-denied-middleware',
      method: 'GET',
      middlewares: [
        (req, res, next) => {
          const { token } = req.query
          if (token !== 'secret-token') {
            res.status(401)
            res.end()
            return
          }
          next()
        },
      ],
      handler: (req, res) => {
        res.end()
      },
    },
    tests: [
      {
        request: {
          query: stringifyQuery({}, { arrayFormat: 'bracket' }),
        },
        accept: async (response) => {
          expect(response.status).toEqual(401)
        },
      },
      {
        request: {
          query: stringifyQuery(
            { token: 'secret-token' },
            { arrayFormat: 'bracket' }
          ),
        },
        accept: async (response) => {
          expect(response.status).toEqual(200)
        },
      },
    ],
  },
  {
    route: {
      pattern: '/send-form-data',
      method: 'POST',
      handler: async (req, res) => {
        const multipartData = await parseMultipartData(req)
        res.json(multipartData)
      },
    },
    tests: [
      {
        request: (() => {
          const form = new FormData()
          form.append('login', 'login')
          form.append('password', 'password')
          form.append('value', 42)
          return {
            body: form.getBuffer(),
            headers: form.getHeaders(),
          }
        })(),
        accept: async (response) => {
          expect(response.status).toEqual(200)
          expect((await response.json()).fields).toEqual({
            login: 'login',
            password: 'password',
            value: '42',
          })
        },
      },
    ],
  },
  {
    route: {
      pattern: '/parse-urlencoded',
      method: 'POST',
      handler: async (req, res) => {
        const urlencoded = await parseUrlencoded(req)
        res.json(urlencoded)
      },
    },
    tests: [
      {
        request: {
          body: Buffer.from(
            stringifyQuery(
              { a: 'test', b: ['one', 'two'] },
              { arrayFormat: 'bracket' }
            )
          ),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          },
        },
        accept: async (response) => {
          expect(response.status).toEqual(200)
          expect(await response.json()).toEqual({
            a: 'test',
            b: ['one', 'two'],
          })
        },
      },
    ],
  },
]

const corsMods: Array<{
  cors: CORS
  describe: string
}> = [
  {
    cors: {},
    describe: 'Disabled CORS',
  },
  // {
  //   cors: {
  //     origin: true,
  //   },
  //   describe: 'Enabled CORS',
  // },
]

for (const { describe: corsDescribe, cors } of corsMods) {
  describe(corsDescribe, () => {
    let localHttpServer: Server
    let localHttpServerBaseUrl: string
    let lambdaServer: Server
    let lambdaServerBaseUrl: string
    beforeAll(async () => {
      const routerConfigBuilder = new RouterConfigBuilder(() => customApi)
      routerConfigBuilder.setupCORS(cors)
      for (const { route } of tests) {
        routerConfigBuilder.addRoute(route)
      }
      const routerConfig = routerConfigBuilder.instantiate()

      {
        localHttpServer = await new Promise((resolve) => {
          const refServer = http
            .createServer(HttpServer.createRouter(routerConfig))
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
              const url = new URL(req.url ?? '', 'https://example.com')

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
                httpMethod: req.method as HttpMethods,
                querystring: url.search.replace(/^?/, ''),
              }

              const lambdaHandler = AWSLambdaOriginEdge.createRouter(
                routerConfig
              )

              const lambdaOriginEdgeResponse = await lambdaHandler(
                lambdaEvent,
                {}
              )

              res.statusCode = lambdaOriginEdgeResponse.httpStatus

              res.end(
                Buffer.from(lambdaOriginEdgeResponse.body).toString('base64')
              )
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
      route: { pattern: pathname, method },
      tests: testFunctions,
    } of tests) {
      for (const { request, accept } of testFunctions) {
        const { query, headers, body } = request
        const path = `${pathname}${query != null ? `?${query}` : ''}`

        test(`Request ${path} ${JSON.stringify(
          request
        )} should work correctly\n${prettify(accept.toString(), {
          parser: 'typescript',
          semi: true,
          trailingComma: 'none',
          // eslint-disable-next-line no-loop-func
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
            await accept(localHttpServerResponse)
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
            await accept(lambdaServerResponse)
          }
        })
      }
    }
  })
}
