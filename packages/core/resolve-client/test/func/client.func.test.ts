import fetch from 'node-fetch'
import express from 'express'
import {
  getClient,
  Client,
  createWaitForResponseMiddleware,
  createRetryOnErrorMiddleware,
} from '../../src/index'

let app: any
let server: any
let serverState: any

beforeAll(() => {
  serverState = {
    waitForResultAttempts: 0,
    retryOnErrorAttempts: 0,
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
            valid: false,
          },
        })
      )
    } else {
      res.send(
        JSON.stringify({
          data: {
            valid: true,
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

  server = app.listen('3300')
})

afterAll(() => {
  server.close()
})

let client: Client

beforeEach(() => {
  client = getClient({
    origin: 'http://localhost:3300',
    rootPath: '',
    staticPath: '/static',
    viewModels: [],
    fetch,
  })
})

test('bug: waitFor headers are undefined on success validation', async () => {
  const result = await client.query(
    {
      name: 'read-model',
      resolver: 'resolver',
      args: {},
    },
    {
      waitFor: {
        validator: (result: any): boolean => result.data.status === 'valid',
        attempts: 1,
        period: 1,
      },
    }
  )
  expect(result).toEqual({
    meta: {
      timestamp: 12345,
    },
    data: {
      status: 'valid',
    },
  })
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

test('middleware: retry on error', async () => {
  serverState.retryOnErrorAttempts = 0
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
  serverState.retryOnErrorAttempts = 0
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
