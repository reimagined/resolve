// eslint-disable-next-line import/no-extraneous-dependencies
import { mocked } from 'ts-jest/utils'
import { request, VALIDATED_RESULT } from '../../src/request'
import { Context } from '../../src/context'
import determineOrigin from '../../src/determine_origin'
import { getRootBasedUrl } from '../../src/utils'
import { GenericError, HttpError } from '../../src/errors'

jest.mock('../../src/determine_origin', () =>
  jest.fn((origin): string => origin)
)
jest.mock('../../src/utils', () => ({
  getRootBasedUrl: jest.fn(() => 'http://root-based.url')
}))
const mFetch = jest.fn(() => ({
  ok: true,
  status: 200,
  headers: {
    get: (): void => undefined
  },
  text: (): Promise<string> => Promise.resolve('response')
}))
const mDetermineOrigin = mocked(determineOrigin)
const mGetRootBasedUrl = mocked(getRootBasedUrl)
const createMockContext = (): Context => ({
  origin: 'mock-origin',
  staticPath: 'static-path',
  rootPath: 'root-path',
  jwtProvider: undefined,
  subscribeAdapter: undefined,
  viewModels: []
})

beforeAll(() => {
  ;(global as any).fetch = mFetch
})

afterAll(() => {
  ;(global as any).fetch = undefined
})

let mockContext: Context

beforeEach(() => {
  mockContext = createMockContext()
})

afterEach(() => {
  mFetch.mockClear()
  mDetermineOrigin.mockClear()
  mGetRootBasedUrl.mockClear()
})

test('root based url constructed with valid parameters', async () => {
  await request(mockContext, '/request', {
    param: 'param'
  })

  expect(mDetermineOrigin).toHaveBeenCalledWith('mock-origin')
  expect(mGetRootBasedUrl).toHaveBeenCalledWith(
    'root-path',
    '/request',
    'mock-origin'
  )
})

test('global fetch called', async () => {
  await request(mockContext, '/request', {
    param: 'param'
  })

  expect(mFetch).toHaveBeenCalledWith('http://root-based.url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ param: 'param' })
  })
})

test('http error thrown with response text', async () => {
  const fetchResult = mFetch()
  mFetch.mockClear()

  mFetch.mockReturnValueOnce({
    ...fetchResult,
    ok: false,
    status: 500,
    text: () => Promise.resolve('error-text')
  })

  await expect(
    request(mockContext, '/request', {
      param: 'param'
    })
  ).rejects.toEqual(new HttpError(500, 'error-text'))
})

test('jwt set to authorization header', async () => {
  const jwtProvider = {
    get: jest.fn(() => Promise.resolve('j-w-t')),
    set: jest.fn()
  }

  await request({ ...mockContext, jwtProvider }, '/request', {
    param: 'param'
  })

  expect(jwtProvider.get).toHaveBeenCalled()
  expect(mFetch).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer j-w-t' })
    })
  )
})

test('jwt updated via provider with response header', async () => {
  const jwtProvider = {
    get: jest.fn(() => Promise.resolve('j-w-t')),
    set: jest.fn()
  }
  const getHeader = jest.fn(() => 'response-jwt')
  const fetchResult = mFetch()
  mFetch.mockClear()

  mFetch.mockReturnValueOnce({
    ...fetchResult,
    headers: {
      get: getHeader
    }
  })

  await request({ ...mockContext, jwtProvider }, '/request', {
    param: 'param'
  })

  expect(jwtProvider.set).toHaveBeenCalledWith('response-jwt')
  expect(getHeader).toHaveBeenCalledWith('x-jwt')
})

test('retry on error', async () => {
  const fetchResult = mFetch()
  mFetch.mockClear()

  mFetch.mockReturnValueOnce({
    ...fetchResult,
    ok: false,
    status: 401
  })

  const response = await request(
    mockContext,
    '/request',
    {
      param: 'param'
    },
    {
      retryOnError: {
        errors: 401,
        attempts: 1,
        period: 1
      },
      debug: false
    }
  )

  expect(mFetch).toHaveBeenCalledTimes(2)
  expect(response).toEqual(
    expect.objectContaining({
      ok: true,
      status: 200
    })
  )
})

test('retry on various errors', async () => {
  const fetchResult = mFetch()
  mFetch.mockClear()

  mFetch.mockReturnValueOnce({
    ...fetchResult,
    ok: false,
    status: 401
  })
  mFetch.mockReturnValueOnce({
    ...fetchResult,
    ok: false,
    status: 500
  })

  const response = await request(
    mockContext,
    '/request',
    {
      param: 'param'
    },
    {
      retryOnError: {
        errors: [401, 500],
        attempts: 2,
        period: 1
      },
      debug: false
    }
  )

  expect(mFetch).toHaveBeenCalledTimes(3)
  expect(response).toEqual(
    expect.objectContaining({
      ok: true,
      status: 200
    })
  )
})

test('fail on unexpected errors', async () => {
  const fetchResult = mFetch()
  mFetch.mockClear()

  mFetch.mockReturnValueOnce({
    ...fetchResult,
    ok: false,
    status: 500
  })
  mFetch.mockReturnValueOnce({
    ...fetchResult,
    ok: false,
    status: 401
  })

  await expect(
    request(
      mockContext,
      '/request',
      {
        param: 'param'
      },
      {
        retryOnError: {
          errors: 500,
          attempts: 1,
          period: 1
        },
        debug: false
      }
    )
  ).rejects.toEqual(
    expect.objectContaining({
      code: 401
    })
  )

  expect(mFetch).toHaveBeenCalledTimes(2)
})

test('wait for valid response', async () => {
  const fetchResult = mFetch()
  mFetch.mockClear()

  mFetch.mockReturnValueOnce({
    ...fetchResult,
    text: () => Promise.resolve('invalid')
  })
  mFetch.mockReturnValueOnce({
    ...fetchResult,
    text: () => Promise.resolve('valid')
  })

  const response = await request(
    mockContext,
    '/request',
    {
      param: 'param'
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
        }
      }
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
    text: () => Promise.resolve('invalid')
  })
  mFetch.mockReturnValueOnce({
    ...fetchResult,
    text: () => Promise.resolve('invalid')
  })
  mFetch.mockReturnValueOnce({
    ...fetchResult,
    text: () => Promise.resolve('valid')
  })

  await expect(
    request(
      mockContext,
      '/request',
      {
        param: 'param'
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
          }
        }
      }
    )
  ).rejects.toBeInstanceOf(GenericError)
  expect(mFetch).toHaveBeenCalledTimes(2)
})
