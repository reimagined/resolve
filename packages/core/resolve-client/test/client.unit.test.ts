/* eslint-disable import/no-extraneous-dependencies */
import { isEqual } from 'lodash'
import { mocked } from 'ts-jest/utils'
/* eslint-enable import/no-extraneous-dependencies */
import { Client, getClient } from '../src/client'
import { Context } from '../src/context'
import { NarrowedResponse, request } from '../src/request'

jest.mock('../src/request', () => ({
  request: jest.fn()
}))
jest.mock('../src/subscribe', () => ({}))

const createMockResponse = (overrides: object = {}): NarrowedResponse => ({
  ok: true,
  status: 200,
  headers: {
    get: (header: string): string | null => `${header}-value`
  },
  json: (): Promise<object> =>
    Promise.resolve({
      data: 'response-data'
    }),
  text: (): Promise<string> => Promise.resolve('response-text'),
  ...overrides
})

const createMockContext = (staticPath = 'static-path'): Context => ({
  origin: 'mock-origin',
  staticPath,
  rootPath: 'root-path',
  jwtProvider: undefined,
  subscribeAdapter: undefined,
  viewModels: []
})

const mRequest = mocked(request)

let mockContext: Context
let client: Client

beforeAll(() => {
  mRequest.mockResolvedValue(createMockResponse())
})

beforeEach(() => {
  mockContext = createMockContext()
  client = getClient(mockContext)
})

afterEach(() => {
  mRequest.mockClear()
})

describe('command', () => {
  let getHeader: () => string
  let getJson: () => Promise<object>

  beforeEach(() => {
    getHeader = jest.fn((): string => '12345')
    getJson = jest.fn(
      (): Promise<object> =>
        Promise.resolve({
          result: 'command-result'
        })
    )
    mRequest.mockResolvedValue(
      createMockResponse({
        headers: {
          get: getHeader
        },
        json: getJson
      })
    )
  })

  test('request without options', async () => {
    await client.command({
      aggregateName: 'user',
      aggregateId: 'user-id',
      type: 'create',
      payload: {
        name: 'user-name'
      }
    })

    expect(mRequest).toHaveBeenCalledWith(
      mockContext,
      '/api/commands',
      {
        aggregateName: 'user',
        aggregateId: 'user-id',
        type: 'create',
        payload: {
          name: 'user-name'
        }
      },
      undefined
    )
  })

  test('request with options', async () => {
    await client.command(
      {
        aggregateName: 'user',
        aggregateId: 'user-id',
        type: 'create',
        payload: {
          name: 'user-name'
        }
      },
      {
        option: 'option'
      }
    )

    expect(mRequest).toHaveBeenCalledWith(
      mockContext,
      '/api/commands',
      {
        aggregateName: 'user',
        aggregateId: 'user-id',
        type: 'create',
        payload: {
          name: 'user-name'
        }
      },
      {
        option: 'option'
      }
    )
  })

  test('result constructed from response data', async () => {
    const result = await client.command({
      aggregateName: 'user',
      aggregateId: 'user-id',
      type: 'create',
      payload: {
        name: 'user-name'
      }
    })

    expect(getJson).toHaveBeenCalled()
    expect(result).toEqual({
      result: 'command-result'
    })
  })

  test('callback instead of options', done => {
    client.command(
      {
        aggregateName: 'user',
        aggregateId: 'user-id',
        type: 'create',
        payload: {
          name: 'user-name'
        }
      },
      (error, result) => {
        if (error) {
          done(error)
        }

        expect(result).toEqual({
          result: 'command-result'
        })

        done()
      }
    )
  })
})

describe('query', () => {
  let getHeader: () => string
  let getJson: () => Promise<object>

  beforeEach(() => {
    getHeader = jest.fn((): string => '12345')
    getJson = jest.fn(
      (): Promise<object> =>
        Promise.resolve({
          result: 'query-result'
        })
    )
    mRequest.mockResolvedValue(
      createMockResponse({
        headers: {
          get: getHeader
        },
        json: getJson
      })
    )
  })

  test('valid request made', async () => {
    await client.query({
      name: 'query-name',
      resolver: 'query-resolver',
      args: {
        name: 'value'
      }
    })

    expect(mRequest).toHaveBeenCalledWith(
      mockContext,
      '/api/query/query-name/query-resolver',
      {
        name: 'value'
      },
      {
        method: 'GET'
      }
    )
  })

  test('result constructed from response data', async () => {
    const result = await client.query({
      name: 'query-name',
      resolver: 'query-resolver',
      args: {
        name: 'value'
      }
    })

    expect(getHeader).toHaveBeenCalledWith('Date')
    expect(getJson).toHaveBeenCalled()
    expect(result).toEqual({
      timestamp: 12345,
      data: {
        result: 'query-result'
      }
    })
  })

  test('callback instead of options', done => {
    client.query(
      {
        name: 'query-name',
        resolver: 'query-resolver',
        args: {
          name: 'value'
        }
      },
      (error, result) => {
        if (error) {
          done(error)
        }

        expect(result).toEqual({
          timestamp: 12345,
          data: {
            result: 'query-result'
          }
        })

        done()
      }
    )
  })

  test('awaiting for result', async () => {
    await client.query(
      {
        name: 'query-name',
        resolver: 'query-resolver',
        args: {
          name: 'value'
        }
      },
      {
        waitFor: {
          validator: isEqual.bind(null, {
            result: 'valid-result'
          }),
          attempts: 1,
          period: 1
        }
      }
    )
    expect(mRequest).toHaveBeenCalledWith(
      mockContext,
      '/api/query/query-name/query-resolver',
      {
        name: 'value'
      },
      {
        method: 'GET',
        waitForResponse: {
          validator: expect.any(Function),
          period: 1,
          attempts: 1
        }
      }
    )

    const validator = mRequest.mock.calls[0][3]?.waitForResponse
      ?.validator as Function

    await expect(
      validator(
        createMockResponse({
          json: (): Promise<any> =>
            Promise.resolve({
              result: 'invalid-result'
            })
        })
      )
    ).resolves.toEqual(false)
    await expect(
      validator(
        createMockResponse({
          json: (): Promise<any> =>
            Promise.resolve({
              result: 'valid-result'
            })
        })
      )
    ).resolves.toBeTruthy()
  })

  test('POST method support', async () => {
    await client.query(
      {
        name: 'query-name',
        resolver: 'query-resolver',
        args: {
          name: 'value'
        }
      },
      {
        method: 'POST'
      }
    )
    expect(mRequest).toHaveBeenCalledWith(
      mockContext,
      '/api/query/query-name/query-resolver',
      {
        name: 'value'
      },
      {
        method: 'POST'
      }
    )
  })

  test('default GET method if user not provide it within options', async () => {
    await client.query(
      {
        name: 'query-name',
        resolver: 'query-resolver',
        args: {
          name: 'value'
        }
      },
      {}
    )
    expect(mRequest).toHaveBeenCalledWith(
      mockContext,
      '/api/query/query-name/query-resolver',
      {
        name: 'value'
      },
      {
        method: 'GET'
      }
    )
  })
})

describe('getStaticAssetUrl', () => {
  test('absolute asset url', () => {
    expect(
      client.getStaticAssetUrl('https://static.host.com/account/static.jpg')
    ).toEqual('https://static.host.com/account/static.jpg')
  })

  test('absolute static url', () => {
    client = getClient(createMockContext('https://static.host.com'))

    expect(client.getStaticAssetUrl('/account/static.jpg')).toEqual(
      'https://static.host.com/account/static.jpg'
    )
  })

  test('root based static url', () => {
    expect(client.getStaticAssetUrl('/account/static.jpg')).toEqual(
      'mock-origin/root-path/static-path/account/static.jpg'
    )
  })

  test('asset path should have leading slash', () => {
    expect(() => client.getStaticAssetUrl('account/static.jpg')).toThrow()
  })

  test('empty asset path', () => {
    expect(() => client.getStaticAssetUrl('')).toThrow()
  })

  test('empty static path', () => {
    client = getClient(createMockContext(''))

    expect(() => client.getStaticAssetUrl('account/static.jpg')).toThrow()
  })
})
