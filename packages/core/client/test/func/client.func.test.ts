/* eslint-disable no-console */

import fetch from 'node-fetch'
import express from 'express'
import {
  getClient,
  Client,
  createWaitForResponseMiddleware,
  createRetryOnErrorMiddleware,
  GenericError,
} from '../../src/index'
import { createRefreshTokenMiddleware } from './refresh-token-middleware'

let app: any
let server: any
let serverState: any

beforeAll(() => {
  serverState = {
    waitForResultAttempts: 0,
    retryOnErrorAttempts: 0,
    mixedAttempts: 0,
    tokenRequests: 0,
  }

  app = express()

  app.get('/api/query/read-model/resolver', (req: any, res: any) => {
    res.setHeader('Date', '12345')
    res.send(
      JSON.stringify({
        data: {
          status: 'valid',
        },
      })
    )
  })

  app.get('/api/query/read-model/wait-for-result', (req: any, res: any) => {
    serverState.waitForResultAttempts++
    res.setHeader('Date', '12345')
    if (serverState.waitForResultAttempts > 3) {
      res.send(
        JSON.stringify({
          data: {
            valid: true,
          },
        })
      )
    } else {
      res.send(
        JSON.stringify({
          data: {
            valid: false,
          },
        })
      )
    }
  })

  app.get('/api/query/read-model/retry-on-error', (req: any, res: any) => {
    serverState.retryOnErrorAttempts++
    res.setHeader('Date', '12345')
    if (serverState.retryOnErrorAttempts > 3) {
      res.send(
        JSON.stringify({
          data: {
            valid: true,
          },
        })
      )
    } else {
      res.status(500 + serverState.retryOnErrorAttempts)
      res.send(
        JSON.stringify({
          message: 'error',
        })
      )
    }
  })

  app.get('/api/query/read-model/mixed-middleware', (req: any, res: any) => {
    serverState.mixedAttempts++
    const { mixedAttempts } = serverState
    res.setHeader('Date', '12345')

    switch (mixedAttempts) {
      case 1:
        res.send(
          JSON.stringify({
            data: {
              valid: false,
            },
          })
        )
        break

      case 2:
        res.status(501)
        res.send(
          JSON.stringify({
            message: 'error',
          })
        )
        break

      case 3:
        res.send(
          JSON.stringify({
            data: {
              valid: false,
            },
          })
        )
        break

      case 4:
        res.status(502)
        res.send(
          JSON.stringify({
            message: 'error',
          })
        )
        break

      default:
        res.send(
          JSON.stringify({
            data: {
              valid: true,
            },
          })
        )
        break
    }

    res.setHeader('Date', '12345')
    if (serverState.retryOnErrorAttempts > 3) {
      res.send(
        JSON.stringify({
          data: {
            valid: true,
          },
        })
      )
    } else {
      res.status(500 + serverState.retryOnErrorAttempts)
      res.send(
        JSON.stringify({
          message: 'error',
        })
      )
    }
  })

  app.get('/api/query/read-model/refresh-token', (req: any, res: any) => {
    const auth = req.header('Authorization')
    res.setHeader('Date', '12345')
    if (auth !== 'Bearer valid-token') {
      res.status(401)
      res.send(
        JSON.stringify({
          message: 'unauthorized access',
        })
      )
    } else {
      res.send(
        JSON.stringify({
          data: {
            authorized: true,
          },
        })
      )
    }
  })

  app.get('/get-token', (req: any, res: any) => {
    serverState.tokenRequests++
    res.send(
      JSON.stringify({
        token: 'valid-token',
      })
    )
  })

  server = app.listen('3300')
})

afterAll(() => {
  server.close()
})

let client: Client
let jwtProviderRef: any

beforeEach(() => {
  jwtProviderRef = {}
  client = getClient({
    origin: 'http://localhost:3300',
    rootPath: '',
    staticPath: '/static',
    viewModels: [],
    fetch,
    jwtProvider: {
      get: async () => Promise.resolve(jwtProviderRef.token),
      set: async (token) => {
        jwtProviderRef.token = token
      },
    },
  })
  serverState.tokenRequests = 0
  serverState.waitForResultAttempts = 0
  serverState.retryOnErrorAttempts = 0
  serverState.mixedAttempts = 0
})

test('middleware: wait for response', async () => {
  const result = await client.query(
    {
      name: 'read-model',
      resolver: 'wait-for-result',
      args: {},
    },
    {
      middleware: {
        response: createWaitForResponseMiddleware({
          debug: true,
          attempts: 3,
          period: 1,
          validator: async (response, confirm) => {
            if (response.ok) {
              const result = await response.json()
              if (result.data.valid) {
                confirm(result)
              }
            }
          },
        }),
      },
    }
  )
  expect(result).toEqual({
    meta: {
      timestamp: 12345,
    },
    data: {
      valid: true,
    },
  })
})

test('middleware: wait for response should fail if attempts limit reached', async () => {
  await expect(
    client.query(
      {
        name: 'read-model',
        resolver: 'wait-for-result',
        args: {},
      },
      {
        middleware: {
          response: createWaitForResponseMiddleware({
            debug: true,
            attempts: 2,
            period: 1,
            validator: async (response, confirm) => {
              if (response.ok) {
                const result = await response.json()
                if (result.data.valid) {
                  confirm(result)
                }
              }
            },
          }),
        },
      }
    )
  ).rejects.toBeInstanceOf(GenericError)
})

test('middleware: retry on error', async () => {
  const result = await client.query(
    {
      name: 'read-model',
      resolver: 'retry-on-error',
      args: {},
    },
    {
      middleware: {
        error: createRetryOnErrorMiddleware({
          debug: true,
          attempts: 3,
          period: 1,
          errors: [501, 502, 503],
        }),
      },
    }
  )
  expect(result).toEqual({
    meta: {
      timestamp: 12345,
    },
    data: {
      valid: true,
    },
  })
})

test('middleware: retry on error should fail on unexpected error', async () => {
  await expect(
    client.query(
      {
        name: 'read-model',
        resolver: 'retry-on-error',
        args: {},
      },
      {
        middleware: {
          error: createRetryOnErrorMiddleware({
            debug: true,
            attempts: 3,
            period: 1,
            errors: [501, 502],
          }),
        },
      }
    )
  ).rejects.toEqual(
    expect.objectContaining({
      code: 503,
    })
  )
})

test('middleware: mixed response & error middleware', async () => {
  const result = await client.query(
    {
      name: 'read-model',
      resolver: 'mixed-middleware',
      args: {},
    },
    {
      middleware: {
        error: createRetryOnErrorMiddleware({
          debug: true,
          attempts: 2,
          period: 1,
          errors: [501, 502],
        }),
        response: createWaitForResponseMiddleware({
          debug: true,
          attempts: 2,
          period: 1,
          validator: async (response, confirm) => {
            if (response.ok) {
              const result = await response.json()
              if (result.data.valid) {
                confirm(result)
              }
            }
          },
        }),
      },
    }
  )
  expect(result).toEqual({
    meta: {
      timestamp: 12345,
    },
    data: {
      valid: true,
    },
  })
})

test('middleware: refresh token example middleware test', async () => {
  jest.setTimeout(100000)
  const exclusiveState = {}

  const query = async (salt: string) =>
    client.query(
      {
        name: 'read-model',
        resolver: 'refresh-token',
        args: {
          salt,
        },
      },
      {
        middleware: {
          error: createRefreshTokenMiddleware(exclusiveState),
        },
      }
    )

  const result = await Promise.all([
    query('first'),
    query('second'),
    query('third'),
  ])
  const responseSample = {
    meta: {
      timestamp: 12345,
    },
    data: {
      authorized: true,
    },
  }
  expect(result).toEqual([responseSample, responseSample, responseSample])
  expect(serverState.tokenRequests).toEqual(1)
})
