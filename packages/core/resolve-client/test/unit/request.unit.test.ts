// eslint-disable-next-line import/no-extraneous-dependencies
import qs from 'query-string'
import { mocked } from 'ts-jest/utils'
import { request, RequestOptions, VALIDATED_RESULT } from '../../src/request'
import { Context } from '../../src/context'
import determineOrigin from '../../src/determine-origin'
import { getRootBasedUrl } from '../../src/utils'
import { GenericError, HttpError } from '../../src/errors'
import {
  requestWithMiddleware,
  ClientMiddlewareOptions,
} from '../../src/middleware'

jest.mock('query-string')
jest.mock('../../src/determine-origin', () =>
  jest.fn((origin): string => origin)
)
jest.mock('../../src/utils', () => ({
  getRootBasedUrl: jest.fn(() => 'http://root-based.url'),
  isString: jest.fn((val) => typeof val === 'string'),
}))
jest.mock('../../src/middleware', () => ({
  requestWithMiddleware: jest.fn(() => ({
    headers: {},
  })),
}))
const mFetch = jest.fn(() => ({
  ok: true,
  status: 200,
  headers: {
    get: (): void => undefined,
  },
  text: (): Promise<string> => Promise.resolve('response'),
}))
const mQueryString = mocked(qs)
const mDetermineOrigin = mocked(determineOrigin)
const mGetRootBasedUrl = mocked(getRootBasedUrl)
const mRequestWithMiddleware = mocked(requestWithMiddleware)
const createMockContext = (): Context => ({
  origin: 'mock-origin',
  staticPath: 'static-path',
  rootPath: 'root-path',
  jwtProvider: undefined,
  viewModels: [],
})

beforeAll(() => {
  void ((global as any).fetch = mFetch)
})

afterAll(() => {
  void ((global as any).fetch = undefined)
})

let mockContext: Context

beforeEach(() => {
  mockContext = createMockContext()
})

afterEach(() => {
  mFetch.mockClear()
  mDetermineOrigin.mockClear()
  mGetRootBasedUrl.mockClear()
  mRequestWithMiddleware.mockClear()
  mQueryString.stringify.mockClear()
})

describe('common', () => {
  test('root based url constructed with valid parameters', async () => {
    await request(mockContext, '/request', {
      param: 'param',
    })

    expect(mDetermineOrigin).toHaveBeenCalledWith('mock-origin')
    expect(mGetRootBasedUrl).toHaveBeenCalledWith(
      'root-path',
      '/request',
      'mock-origin'
    )
  })
})

describe('middleware mode', () => {
  const middlewareOptions = (
    options?: ClientMiddlewareOptions
  ): RequestOptions => ({
    middleware: options ?? {},
  })

  test('request with middleware invoked', async () => {
    const options = middlewareOptions()
    await request(
      mockContext,
      '/request',
      {
        param: 'param',
      },
      middlewareOptions()
    )
    expect(mRequestWithMiddleware).toHaveBeenCalledWith(
      {
        fetch: mFetch,
        info: 'http://root-based.url',
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ param: 'param' }),
        },
      },
      options.middleware
    )
  })

  test('jwt provider passed to middleware', async () => {
    const options = middlewareOptions()
    const jwtProvider = {
      get: jest.fn(() => Promise.resolve('j-w-t')),
      set: jest.fn(),
    }
    await request(
      { ...mockContext, jwtProvider },
      '/request',
      {
        param: 'param',
      },
      middlewareOptions()
    )
    expect(mRequestWithMiddleware).toHaveBeenCalledWith(
      {
        fetch: mFetch,
        info: 'http://root-based.url',
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ param: 'param' }),
        },
        jwtProvider,
      },
      options.middleware
    )
  })

  test('compatible response constructed', async () => {
    const mockResult = {
      headers: {
        header: 'value',
        get: () => 'value',
      },
      result: {
        data: 'data',
      },
    }

    mRequestWithMiddleware.mockResolvedValueOnce(mockResult)

    const response = await request(
      mockContext,
      '/request',
      {
        param: 'param',
      },
      middlewareOptions()
    )

    expect(response.ok).toBeTruthy()
    expect(response.headers).toEqual(mockResult.headers)
    expect(response[VALIDATED_RESULT]).toEqual(mockResult.result)
    await expect(response.json()).resolves.toEqual(mockResult.result)
    await expect(response.text()).resolves.toEqual(mockResult.result)
  })

  test('compatible response if error occurred', async () => {
    const mockResult = {
      headers: {
        header: 'value',
        get: () => 'value',
      },
      result: Error('error'),
    }

    mRequestWithMiddleware.mockResolvedValueOnce(mockResult)

    const response = await request(
      mockContext,
      '/request',
      {
        param: 'param',
      },
      middlewareOptions()
    )

    expect(response.ok).not.toBeTruthy()
  })

  test('middleware mode toggle if no options provided (default)', async () => {
    await request(mockContext, '/request', {
      param: 'param',
    })
    expect(mRequestWithMiddleware).toHaveBeenCalled()
  })

  test('query string options support for GET method', async () => {
    mQueryString.stringify.mockReturnValueOnce(
      'query-string-with-custom-options'
    )
    await request(
      mockContext,
      '/request',
      {
        array: ['a', 'b'],
      },
      {
        method: 'GET',
        queryStringOptions: {
          arrayFormat: 'index',
        },
      }
    )
    expect(mQueryString.stringify).toHaveBeenCalledWith(
      {
        array: ['a', 'b'],
      },
      {
        arrayFormat: 'index',
      }
    )
    expect(mRequestWithMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        info: 'http://root-based.url?query-string-with-custom-options',
      }),
      undefined
    )
  })

  test('default query string options for GET method', async () => {
    mQueryString.stringify.mockReturnValueOnce(
      'query-string-with-default-options'
    )
    await request(
      mockContext,
      '/request',
      {
        array: ['a', 'b'],
      },
      {
        method: 'GET',
      }
    )
    expect(mQueryString.stringify).toHaveBeenCalledWith(
      {
        array: ['a', 'b'],
      },
      {
        arrayFormat: 'bracket',
      }
    )
    expect(mRequestWithMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        info: 'http://root-based.url?query-string-with-default-options',
      }),
      undefined
    )
  })
})

describe('deprecated mode (options)', () => {
  const deprecatedOptions = (override: RequestOptions = {}): RequestOptions =>
    Object.assign(
      {
        retryOnError: {
          attempts: 1,
          errors: [],
          period: 1,
        },
      },
      override
    )

  test('global fetch called', async () => {
    await request(
      mockContext,
      '/request',
      {
        param: 'param',
      },
      deprecatedOptions()
    )

    expect(mFetch).toHaveBeenCalledWith('http://root-based.url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ param: 'param' }),
    })
  })

  test('custom fetch called', async () => {
    mockContext.fetch = jest.fn(() => ({ ok: true }))
    await request(
      mockContext,
      '/request',
      {
        param: 'param',
      },
      deprecatedOptions()
    )
    expect(mFetch).not.toHaveBeenCalled()
    expect(mockContext.fetch).toHaveBeenCalled()
  })

  test('http error thrown with response text', async () => {
    const fetchResult = mFetch()
    mFetch.mockClear()

    mFetch.mockReturnValueOnce({
      ...fetchResult,
      ok: false,
      status: 500,
      text: () => Promise.resolve('error-text'),
    })

    await expect(
      request(
        mockContext,
        '/request',
        {
          param: 'param',
        },
        deprecatedOptions()
      )
    ).rejects.toEqual(new HttpError(500, 'error-text'))
  })

  test('jwt set to authorization header', async () => {
    const jwtProvider = {
      get: jest.fn(() => Promise.resolve('j-w-t')),
      set: jest.fn(),
    }

    await request(
      { ...mockContext, jwtProvider },
      '/request',
      {
        param: 'param',
      },
      deprecatedOptions()
    )

    expect(jwtProvider.get).toHaveBeenCalled()
    expect(mFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer j-w-t' }),
      })
    )
  })

  test('jwt updated via provider with response header', async () => {
    const jwtProvider = {
      get: jest.fn(() => Promise.resolve('j-w-t')),
      set: jest.fn(),
    }
    const getHeader = jest.fn(() => 'response-jwt')
    const fetchResult = mFetch()
    mFetch.mockClear()

    mFetch.mockReturnValueOnce({
      ...fetchResult,
      headers: {
        get: getHeader,
      },
    })

    await request(
      { ...mockContext, jwtProvider },
      '/request',
      {
        param: 'param',
      },
      deprecatedOptions()
    )

    expect(jwtProvider.set).toHaveBeenCalledWith('response-jwt')
    expect(getHeader).toHaveBeenCalledWith('x-jwt')
  })

  test('retry on error', async () => {
    const fetchResult = mFetch()
    mFetch.mockClear()

    mFetch.mockReturnValueOnce({
      ...fetchResult,
      ok: false,
      status: 401,
    })

    const response = await request(
      mockContext,
      '/request',
      {
        param: 'param',
      },
      {
        retryOnError: {
          errors: 401,
          attempts: 1,
          period: 1,
        },
        debug: false,
      }
    )

    expect(mFetch).toHaveBeenCalledTimes(2)
    expect(response).toEqual(
      expect.objectContaining({
        ok: true,
        status: 200,
      })
    )
  })

  test('retry on various errors', async () => {
    const fetchResult = mFetch()
    mFetch.mockClear()

    mFetch.mockReturnValueOnce({
      ...fetchResult,
      ok: false,
      status: 401,
    })
    mFetch.mockReturnValueOnce({
      ...fetchResult,
      ok: false,
      status: 500,
    })

    const response = await request(
      mockContext,
      '/request',
      {
        param: 'param',
      },
      {
        retryOnError: {
          errors: [401, 500],
          attempts: 2,
          period: 1,
        },
        debug: false,
      }
    )

    expect(mFetch).toHaveBeenCalledTimes(3)
    expect(response).toEqual(
      expect.objectContaining({
        ok: true,
        status: 200,
      })
    )
  })

  test('fail on unexpected errors', async () => {
    const fetchResult = mFetch()
    mFetch.mockClear()

    mFetch.mockReturnValueOnce({
      ...fetchResult,
      ok: false,
      status: 500,
    })
    mFetch.mockReturnValueOnce({
      ...fetchResult,
      ok: false,
      status: 401,
    })

    await expect(
      request(
        mockContext,
        '/request',
        {
          param: 'param',
        },
        {
          retryOnError: {
            errors: 500,
            attempts: 1,
            period: 1,
          },
          debug: false,
        }
      )
    ).rejects.toEqual(
      expect.objectContaining({
        code: 401,
      })
    )

    expect(mFetch).toHaveBeenCalledTimes(2)
  })

  test('wait for valid response', async () => {
    const fetchResult = mFetch()
    mFetch.mockClear()

    mFetch.mockReturnValueOnce({
      ...fetchResult,
      text: () => Promise.resolve('invalid'),
    })
    mFetch.mockReturnValueOnce({
      ...fetchResult,
      text: () => Promise.resolve('valid'),
    })

    const response = await request(
      mockContext,
      '/request',
      {
        param: 'param',
      },
      {
        waitForResponse: {
          attempts: Infinity,
          period: 1,
          validator: async (r, c): Promise<void> => {
            const text = await r.text()
            if (text === 'valid') {
              c(text)
            }
          },
        },
      }
    )

    expect(response[VALIDATED_RESULT]).toEqual('valid')
    expect(mFetch).toHaveBeenCalledTimes(2)
  })

  test('response waiting failed: max attempts reached', async () => {
    const fetchResult = mFetch()
    mFetch.mockClear()

    mFetch.mockReturnValueOnce({
      ...fetchResult,
      text: () => Promise.resolve('invalid'),
    })
    mFetch.mockReturnValueOnce({
      ...fetchResult,
      text: () => Promise.resolve('invalid'),
    })
    mFetch.mockReturnValueOnce({
      ...fetchResult,
      text: () => Promise.resolve('valid'),
    })

    await expect(
      request(
        mockContext,
        '/request',
        {
          param: 'param',
        },
        {
          waitForResponse: {
            attempts: 1,
            period: 1,
            validator: async (r, c): Promise<void> => {
              const text = await r.text()
              if (text === 'valid') {
                c(text)
              }
            },
          },
        }
      )
    ).rejects.toBeInstanceOf(GenericError)
    expect(mFetch).toHaveBeenCalledTimes(2)
  })

  test('query string options support for GET method', async () => {
    mQueryString.stringify.mockReturnValueOnce(
      'query-string-with-custom-options'
    )
    await request(
      mockContext,
      '/request',
      {
        array: ['a', 'b'],
      },
      deprecatedOptions({
        method: 'GET',
        queryStringOptions: {
          arrayFormat: 'index',
        },
      })
    )
    expect(mQueryString.stringify).toHaveBeenCalledWith(
      {
        array: ['a', 'b'],
      },
      {
        arrayFormat: 'index',
      }
    )
    expect(mFetch).toHaveBeenCalledWith(
      'http://root-based.url?query-string-with-custom-options',
      expect.objectContaining({
        method: 'GET',
      })
    )
  })

  test('default query string options for GET method', async () => {
    mQueryString.stringify.mockReturnValueOnce(
      'query-string-with-default-options'
    )
    await request(
      mockContext,
      '/request',
      {
        array: ['a', 'b'],
      },
      deprecatedOptions({
        method: 'GET',
      })
    )
    expect(mQueryString.stringify).toHaveBeenCalledWith(
      {
        array: ['a', 'b'],
      },
      {
        arrayFormat: 'bracket',
      }
    )
    expect(mFetch).toHaveBeenCalledWith(
      'http://root-based.url?query-string-with-default-options',
      expect.objectContaining({
        method: 'GET',
      })
    )
  })
})
