import { mocked } from 'jest-mock'
import { createParseResponseMiddleware } from '../../src/middleware/parse-response'
import { ClientMiddleware, requestWithMiddleware } from '../../src/middleware'
import { JSONWebTokenProvider } from '../../src/jwt-provider'
import { FetchFunction } from '../../src/request'
import { HttpError } from '../../src/errors'

jest.mock('../../src/middleware/parse-response', () => ({
  createParseResponseMiddleware: jest.fn(),
}))

const mCreateParseResponseMiddleware = mocked(createParseResponseMiddleware)
const mFetch = jest.fn()
const mJwtProvider: jest.Mocked<JSONWebTokenProvider> = {
  get: jest.fn(() => Promise.resolve('mock-token')),
  set: jest.fn(),
}
const mDeserializer = jest.fn()
const mockedFetch = (mFetch as unknown) as FetchFunction

const createResponseMiddleware = (
  result: any
): jest.Mocked<ClientMiddleware<Response>> =>
  jest.fn(
    (argument, params): Promise<any> => {
      params.end(result)
      return Promise.resolve()
    }
  )

const createResponsePassThruMiddleware = (): jest.Mocked<
  ClientMiddleware<Response>
> =>
  jest.fn(
    (): Promise<any> => {
      return Promise.resolve()
    }
  )

const createResponseMiddlewareWithState = (
  repeats: number
): jest.Mocked<ClientMiddleware<Response>> =>
  jest.fn(
    (argument, params): Promise<any> => {
      const { attempt } = params.state ?? { attempt: 1 }
      if (attempt >= repeats) {
        params.end({
          headers: {
            get: jest.fn(),
          },
          result: {
            attempt,
          },
        })
      } else {
        params.repeat()
      }

      return Promise.resolve({
        attempt: attempt + 1,
      })
    }
  )

const createErrorMiddleware = (
  retry: boolean
): jest.Mocked<ClientMiddleware<Error>> =>
  jest.fn(
    (error, params): Promise<any> => {
      if (retry) {
        params.repeat()
      }
      return Promise.resolve()
    }
  )

const createErrorMiddlewareWithResult = (
  result: any
): jest.Mocked<ClientMiddleware<Error>> =>
  jest.fn(
    (error, params): Promise<any> => {
      params.end(result)
      return Promise.resolve()
    }
  )

const createMockFetchResponse = (overrides?: any) => ({
  ok: true,
  headers: {
    get: jest.fn((name) => {
      if (name === 'x-jwt') {
        return 'mock-updated-token'
      }
      return 'mock-header-value'
    }),
  },
  json: jest.fn(() => ({
    data: 'fetch-result',
  })),
  text: jest.fn(),
  ...overrides,
})

let mockFetchResponse: any
let mockParseResponseMiddleware: jest.Mocked<ClientMiddleware<Response>>

beforeEach(() => {
  mockParseResponseMiddleware = jest.fn(
    async (response, params): Promise<any> => {
      params.end({
        headers: response.headers,
        result: await response.json(),
      })
    }
  )
  mCreateParseResponseMiddleware.mockReturnValue(mockParseResponseMiddleware)
  mockFetchResponse = createMockFetchResponse()
  mFetch.mockResolvedValue(mockFetchResponse)
})

afterEach(() => {
  mCreateParseResponseMiddleware.mockClear()
  mFetch.mockClear()
  mJwtProvider.get.mockClear()
  mJwtProvider.set.mockClear()
  mDeserializer.mockClear()
})

test('fetch invoked', async () => {
  await requestWithMiddleware({
    info: 'http://request.com',
    init: {},
    fetch: mockedFetch,
  })
  expect(mFetch).toHaveBeenCalledWith('http://request.com', {})
})

test('auth header set with value from the jwt provider', async () => {
  await requestWithMiddleware({
    info: 'http://request.com',
    init: {
      headers: {},
    },
    fetch: mockedFetch,
    jwtProvider: mJwtProvider,
  })
  expect(mJwtProvider.get).toHaveBeenCalled()
  expect(mFetch).toHaveBeenCalledWith('http://request.com', {
    headers: {
      Authorization: 'Bearer mock-token',
    },
  })
})

test('jwt provider value updated with the header value', async () => {
  await requestWithMiddleware({
    info: 'http://request.com',
    init: {},
    fetch: mockedFetch,
    jwtProvider: mJwtProvider,
  })
  expect(mJwtProvider.set).toHaveBeenCalledWith('mock-updated-token')
})

test('default response middleware should be "parse response"', async () => {
  await requestWithMiddleware({
    info: 'http://request.com',
    init: {},
    fetch: mockedFetch,
  })
  expect(mCreateParseResponseMiddleware).toHaveBeenCalledWith()
  expect(mockParseResponseMiddleware).toHaveBeenCalledTimes(1)
  expect(mockParseResponseMiddleware).toHaveBeenCalledWith(mockFetchResponse, {
    fetch: mockedFetch,
    init: {},
    info: 'http://request.com',
    end: expect.any(Function),
    repeat: expect.any(Function),
    state: null,
    deserializer: undefined,
    jwtProvider: undefined,
  })
})

test('single custom response middleware invoked and its result returned', async () => {
  const middleware = createResponseMiddleware('middleware-result')

  const result = await requestWithMiddleware(
    {
      info: 'http://request.com',
      init: {},
      fetch: mockedFetch,
    },
    {
      response: middleware,
    }
  )

  expect(result).toEqual('middleware-result')
  expect(middleware).toHaveBeenCalledTimes(1)
  expect(middleware).toHaveBeenCalledWith(mockFetchResponse, {
    fetch: mockedFetch,
    init: {},
    info: 'http://request.com',
    end: expect.any(Function),
    repeat: expect.any(Function),
    state: null,
    deserializer: undefined,
    jwtProvider: undefined,
  })
})

test('multiple middlewares with one "pass-thru" (end not called)', async () => {
  const passThru = createResponsePassThruMiddleware()
  const second = createResponseMiddleware('second')

  const result = await requestWithMiddleware(
    {
      info: 'http://request.com',
      init: {},
      fetch: mockedFetch,
    },
    {
      response: [passThru, second],
    }
  )
  expect(result).toEqual('second')
  expect(passThru).toHaveBeenCalledTimes(1)
  expect(second).toHaveBeenCalledTimes(1)
})

test('middleware chain interrupted after first "end" call', async () => {
  const first = createResponseMiddleware('first')
  const second = createResponseMiddleware('second')

  const result = await requestWithMiddleware(
    {
      info: 'http://request.com',
      init: {},
      fetch: mockedFetch,
    },
    {
      response: [first, second],
    }
  )
  expect(result).toEqual('first')
  expect(second).toHaveBeenCalledTimes(0)
})

test('parse response middleware presented last in chain and its result returned', async () => {
  const createResponse = createResponseMiddleware('last-in-chain')
  mCreateParseResponseMiddleware.mockReturnValueOnce(createResponse)
  const first = createResponsePassThruMiddleware()
  const second = createResponsePassThruMiddleware()

  const result = await requestWithMiddleware(
    {
      info: 'http://request.com',
      init: {},
      fetch: mockedFetch,
    },
    {
      response: [first, second],
    }
  )
  expect(result).toEqual('last-in-chain')
  expect(first).toHaveBeenCalledTimes(1)
  expect(second).toHaveBeenCalledTimes(1)
})

test('single error middleware invoked on http error and result returned after repeat', async () => {
  const responseMiddleware = createResponseMiddleware('middleware-response')
  const errorMiddleware = createErrorMiddleware(true)

  mFetch.mockResolvedValueOnce(
    createMockFetchResponse({
      ok: false,
      status: 666,
      text: () => 'error text',
    })
  )

  const result = await requestWithMiddleware(
    {
      info: 'http://request.com',
      init: {},
      fetch: mockedFetch,
    },
    {
      error: errorMiddleware,
      response: responseMiddleware,
    }
  )

  expect(result).toEqual('middleware-response')
  expect(errorMiddleware).toHaveBeenCalledTimes(1)
  expect(responseMiddleware).toHaveBeenCalledTimes(1)
  expect(errorMiddleware).toHaveBeenCalledWith(
    new HttpError(666, 'error text'),
    {
      fetch: mockedFetch,
      init: {},
      info: 'http://request.com',
      end: expect.any(Function),
      repeat: expect.any(Function),
      state: null,
      deserializer: undefined,
      jwtProvider: undefined,
    }
  )
})

test('single error middleware invoked fetch error and result returned after repeat', async () => {
  const responseMiddleware = createResponseMiddleware('middleware-result')
  const errorMiddleware = createErrorMiddleware(true)

  mFetch.mockRejectedValueOnce(Error('fetch error'))

  const result = await requestWithMiddleware(
    {
      info: 'http://request.com',
      init: {},
      fetch: mockedFetch,
    },
    {
      error: errorMiddleware,
      response: responseMiddleware,
    }
  )

  expect(result).toEqual('middleware-result')
  expect(errorMiddleware).toHaveBeenCalledTimes(1)
  expect(responseMiddleware).toHaveBeenCalledTimes(1)
  expect(errorMiddleware).toHaveBeenCalledWith(Error('fetch error'), {
    fetch: mockedFetch,
    init: {},
    info: 'http://request.com',
    end: expect.any(Function),
    repeat: expect.any(Function),
    state: null,
    deserializer: undefined,
    jwtProvider: undefined,
  })
})

test('single error middleware invoked on http error and its result returned', async () => {
  const responseMiddleware = createResponseMiddleware('middleware-result')
  const errorMiddleware = createErrorMiddlewareWithResult(
    'error-middleware-result'
  )

  mFetch.mockResolvedValueOnce(
    createMockFetchResponse({
      ok: false,
      status: 666,
      text: () => 'error text',
    })
  )

  const result = await requestWithMiddleware(
    {
      info: 'http://request.com',
      init: {},
      fetch: mockedFetch,
    },
    {
      error: errorMiddleware,
      response: responseMiddleware,
    }
  )

  expect(result).toEqual('error-middleware-result')
  expect(errorMiddleware).toHaveBeenCalledTimes(1)
  expect(responseMiddleware).toHaveBeenCalledTimes(0)
})

test('single error middleware invoked on http error and failed', async () => {
  const responseMiddleware = createResponseMiddleware('middleware-result')
  const errorMiddleware = createErrorMiddlewareWithResult(
    Error('error-middleware-result')
  )

  mFetch.mockResolvedValueOnce(
    createMockFetchResponse({
      ok: false,
      status: 666,
      text: () => 'error text',
    })
  )

  await expect(
    requestWithMiddleware(
      {
        info: 'http://request.com',
        init: {},
        fetch: mockedFetch,
      },
      {
        error: errorMiddleware,
        response: responseMiddleware,
      }
    )
  ).rejects.toEqual(Error('error-middleware-result'))
})

test('multiple error middlewares invoked on http error', async () => {
  const responseMiddleware = createResponseMiddleware('middleware-result')
  const first = createErrorMiddleware(false)
  const second = createErrorMiddleware(true)

  mFetch.mockResolvedValueOnce(
    createMockFetchResponse({
      ok: false,
      status: 666,
      text: () => 'error text',
    })
  )

  const result = await requestWithMiddleware(
    {
      info: 'http://request.com',
      init: {},
      fetch: mockedFetch,
    },
    {
      error: [first, second],
      response: responseMiddleware,
    }
  )

  expect(result).toEqual('middleware-result')
  expect(first).toHaveBeenCalledTimes(1)
  expect(second).toHaveBeenCalledTimes(1)
  expect(responseMiddleware).toHaveBeenCalledTimes(1)
})

test('repeating with custom middleware state', async () => {
  const middleware = createResponseMiddlewareWithState(3)

  const result = await requestWithMiddleware(
    {
      info: 'http://request.com',
      init: {},
      fetch: mockedFetch,
    },
    {
      response: middleware,
    }
  )

  expect(result).toEqual(
    expect.objectContaining({
      result: {
        attempt: 3,
      },
    })
  )
  expect(middleware).toHaveBeenCalledTimes(3)
})
