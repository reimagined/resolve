// eslint-disable-next-line import/no-extraneous-dependencies
import qs from 'query-string'
import { getRootBasedUrl } from '@resolve-js/core'
import { mocked } from 'jest-mock'
import { request, RequestOptions, VALIDATED_RESULT } from '../../src/request'
import { Context } from '../../src/context'
import determineOrigin from '../../src/determine-origin'
import {
  requestWithMiddleware,
  ClientMiddlewareOptions,
} from '../../src/middleware'

jest.mock('query-string')
jest.mock('../../src/determine-origin', () =>
  jest.fn((origin): string => origin)
)
jest.mock('../../src/utils', () => ({
  isString: jest.fn((val) => typeof val === 'string'),
}))
jest.mock('@resolve-js/core', () => ({
  getRootBasedUrl: jest.fn(() => 'http://root-based.url'),
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

let warnMock: jest.SpyInstance
beforeAll(() => {
  void ((global as any).fetch = mFetch)
  warnMock = jest.spyOn(console, 'warn').mockImplementation(void 0)
})

afterAll(() => {
  void ((global as any).fetch = undefined)
  warnMock.mockRestore()
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
