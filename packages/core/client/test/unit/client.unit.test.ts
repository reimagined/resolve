/* eslint-disable import/no-extraneous-dependencies */
import { isEqual } from 'lodash'
import { mocked } from 'ts-jest/utils'
/* eslint-enable import/no-extraneous-dependencies */
import { Client, getClient } from '../../src/client'
import { Context } from '../../src/context'
import { NarrowedResponse, request, VALIDATED_RESULT } from '../../src/request'
import { ViewModel, ViewModelDeserializer } from '../../src/types'
import { IS_BUILT_IN } from '@resolve-js/core'

jest.mock('../../src/request', () => ({
  request: jest.fn(),
}))
jest.mock('../../src/subscribe', () => ({}))

const responseHeaders: { [key: string]: string } = {
  Date: '12345',
  'X-Resolve-View-Model-Subscription': JSON.stringify({ url: 'subscribe-url' }),
}

const createMockResponse = (overrides: object = {}): NarrowedResponse => ({
  ok: true,
  headers: {
    get: jest.fn(
      (header: string): string | null =>
        responseHeaders[header] || `${header}-value`
    ),
  },
  json: (): Promise<object> =>
    Promise.resolve({
      data: JSON.stringify({ data: 'response-data' }),
    }),
  text: (): Promise<string> => Promise.resolve('response-text'),
  ...overrides,
})

const createMockContext = (
  staticPath = 'static-path',
  viewModels: Array<ViewModel> = []
): Context => ({
  origin: 'mock-origin',
  staticPath,
  rootPath: 'root-path',
  jwtProvider: undefined,
  viewModels,
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
          result: 'command-result',
        })
    )
    mRequest.mockResolvedValue(
      createMockResponse({
        headers: {
          get: getHeader,
        },
        json: getJson,
      })
    )
  })

  test('request without options', async () => {
    await client.command({
      aggregateName: 'user',
      aggregateId: 'user-id',
      type: 'create',
      payload: {
        name: 'user-name',
      },
    })

    expect(mRequest).toHaveBeenCalledWith(
      mockContext,
      '/api/commands',
      {
        aggregateName: 'user',
        aggregateId: 'user-id',
        type: 'create',
        payload: {
          name: 'user-name',
        },
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
          name: 'user-name',
        },
      },
      {
        middleware: {},
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
          name: 'user-name',
        },
      },
      {
        middleware: {},
      }
    )
  })

  test('result constructed from response data', async () => {
    const result = await client.command({
      aggregateName: 'user',
      aggregateId: 'user-id',
      type: 'create',
      payload: {
        name: 'user-name',
      },
    })

    expect(getJson).toHaveBeenCalled()
    expect(result).toEqual({
      result: 'command-result',
    })
  })

  test('callback instead of options', (done) => {
    client.command(
      {
        aggregateName: 'user',
        aggregateId: 'user-id',
        type: 'create',
        payload: {
          name: 'user-name',
        },
      },
      (error, result) => {
        if (error) {
          done(error)
        }

        expect(result).toEqual({
          result: 'command-result',
        })

        done()
      }
    )
  })

  test('bug fix: #1629', async () => {
    const error = new Error('Request error')
    mRequest.mockRejectedValueOnce(error)

    let callbackError: any = null

    await new Promise<void>((resolve) =>
      client.command(
        {
          aggregateName: 'user',
          aggregateId: 'user-id',
          type: 'create',
          payload: {
            name: 'user-name',
          },
        },
        (error) => {
          if (error != null) {
            callbackError = error
          }
          resolve()
        }
      )
    )

    expect(callbackError).toBe(error)
  })
})

describe('query', () => {
  let getJson: jest.Mock
  let getHeader: jest.Mock

  beforeEach(() => {
    getJson = jest.fn(
      (): Promise<object> =>
        Promise.resolve({
          data: {
            result: 'query-result',
          },
          meta: {},
        })
    )
    const response = createMockResponse({
      json: getJson,
    })

    getHeader = response.headers.get as jest.Mock

    mRequest.mockResolvedValue(response)
  })

  test('valid request made', async () => {
    await client.query({
      name: 'query-name',
      resolver: 'query-resolver',
      args: {
        name: 'value',
      },
    })

    expect(mRequest).toHaveBeenCalledWith(
      mockContext,
      '/api/query/query-name/query-resolver',
      {
        name: 'value',
      },
      {
        method: 'GET',
      },
      undefined
    )
  })

  test('result constructed from response data', async () => {
    const result = await client.query({
      name: 'query-name',
      resolver: 'query-resolver',
      args: {
        name: 'value',
      },
    })

    expect(getHeader).toHaveBeenCalledWith('Date')
    expect(getJson).toHaveBeenCalled()
    expect(result).toEqual({
      data: {
        result: 'query-result',
      },
      meta: {
        timestamp: 12345,
      },
    })
  })

  test('callback instead of options', (done) => {
    client.query(
      {
        name: 'query-name',
        resolver: 'query-resolver',
        args: {
          name: 'value',
        },
      },
      (error, result) => {
        if (error) {
          done(error)
        }

        expect(result).toEqual({
          data: {
            result: 'query-result',
          },
          meta: {
            timestamp: 12345,
          },
        })

        done()
      }
    )
  })

  test('awaiting for result: response validator with read-model deserializer', async () => {
    await client.query(
      {
        name: 'query-name',
        resolver: 'query-resolver',
        args: {
          name: 'value',
        },
      },
      {
        waitFor: {
          validator: isEqual.bind(null, {
            data: {
              isValid: true,
            },
            meta: {},
          }),
          attempts: 1,
          period: 1,
        },
      }
    )
    expect(mRequest).toHaveBeenCalledWith(
      mockContext,
      '/api/query/query-name/query-resolver',
      {
        name: 'value',
      },
      {
        method: 'GET',
        waitForResponse: {
          validator: expect.any(Function),
          period: 1,
          attempts: 1,
        },
      },
      undefined
    )

    const validator = mRequest.mock.calls[0][3]?.waitForResponse
      ?.validator as Function

    let validResult: string | null = null
    const confirm = (result: string): void => {
      validResult = result
    }

    await validator(
      createMockResponse({
        json: (): Promise<any> =>
          Promise.resolve({
            data: { isValid: false },
            meta: {},
          }),
      }),
      confirm
    )
    expect(validResult).toBeNull()

    await validator(
      createMockResponse({
        json: (): Promise<any> =>
          Promise.resolve({
            data: { isValid: true },
            meta: {},
          }),
      }),
      confirm
    )
    expect(validResult).toEqual({
      data: {
        isValid: true,
      },
      meta: {},
    })
  })

  test('bug: response.json() called again after validation', async () => {
    mRequest.mockResolvedValue(
      createMockResponse({
        headers: {
          get: getHeader,
        },
        json: getJson,
        [VALIDATED_RESULT]: {
          data: {
            result: 'validated-result',
          },
          meta: {},
        },
      })
    )
    const result = await client.query(
      {
        name: 'query-name',
        resolver: 'query-resolver',
        args: {
          name: 'value',
        },
      },
      {
        waitFor: {
          validator: isEqual.bind(null, {
            result: 'query-result',
          }),
          attempts: 1,
          period: 1,
        },
      }
    )
    expect(getJson).toBeCalledTimes(0)
    expect(result).toEqual(
      expect.objectContaining({
        data: {
          result: 'validated-result',
        },
      })
    )
  })

  test('POST method support', async () => {
    await client.query(
      {
        name: 'query-name',
        resolver: 'query-resolver',
        args: {
          name: 'value',
        },
      },
      {
        method: 'POST',
      }
    )
    expect(mRequest).toHaveBeenCalledWith(
      mockContext,
      '/api/query/query-name/query-resolver',
      {
        name: 'value',
      },
      {
        method: 'POST',
      },
      undefined
    )
  })

  test('default GET method if user not provide it within options', async () => {
    await client.query(
      {
        name: 'query-name',
        resolver: 'query-resolver',
        args: {
          name: 'value',
        },
      },
      {}
    )
    expect(mRequest).toHaveBeenCalledWith(
      mockContext,
      '/api/query/query-name/query-resolver',
      {
        name: 'value',
      },
      {
        method: 'GET',
      },
      undefined
    )
  })

  test('use view model state deserializer', async () => {
    const deserializer = (data: string) => JSON.parse(data.slice(3))
    client = getClient(
      createMockContext('static-path', [
        {
          name: 'custom-serializer',
          projection: {
            Init: () => null,
          },
          deserializeState: deserializer,
        },
      ])
    )

    getJson.mockResolvedValueOnce({ data: `>>>${JSON.stringify({ a: 'a' })}` })

    const result = await client.query({
      name: 'custom-serializer',
      aggregateIds: ['id'],
      args: {},
    })

    expect(mRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      deserializer
    )

    expect(result).toEqual({
      data: {
        a: 'a',
      },
      meta: {
        timestamp: 12345,
        url: 'subscribe-url',
      },
    })
  })

  test('ignore view model built-in state deserializer', async () => {
    const buildInDeserializer: ViewModelDeserializer = (data: string) =>
      JSON.parse(data.slice(3))
    buildInDeserializer[IS_BUILT_IN] = true

    client = getClient(
      createMockContext('static-path', [
        {
          name: 'built-in-serializer',
          projection: {
            Init: () => null,
          },
          deserializeState: buildInDeserializer,
        },
      ])
    )

    getJson.mockResolvedValueOnce({ data: { a: 'a' } })

    const result = await client.query({
      name: 'built-in-serializer',
      aggregateIds: ['id'],
      args: {},
    })

    expect(result).toEqual({
      data: {
        a: 'a',
      },
      meta: {
        timestamp: 12345,
        url: 'subscribe-url',
      },
    })
  })

  test('awaiting for result: response validator with view-model built-in deserializer', async () => {
    const builtInDeserializer: ViewModelDeserializer = (data: string) =>
      JSON.parse(data.slice(3))
    builtInDeserializer[IS_BUILT_IN] = true

    client = getClient(
      createMockContext('static-path', [
        {
          name: 'built-in-serializer',
          projection: {
            Init: () => null,
          },
          deserializeState: builtInDeserializer,
        },
      ])
    )

    await client.query(
      {
        name: 'built-in-serializer',
        aggregateIds: ['1'],
        args: {
          name: 'value',
        },
      },
      {
        waitFor: {
          validator: isEqual.bind(null, {
            data: {
              isValid: true,
            },
            meta: {},
          }),
          attempts: 1,
          period: 1,
        },
      }
    )

    const validator = mRequest.mock.calls[0][3]?.waitForResponse
      ?.validator as Function

    let validResult: string | null = null
    const confirm = (result: string): void => {
      validResult = result
    }

    await validator(
      createMockResponse({
        json: (): Promise<any> =>
          Promise.resolve({
            data: { isValid: false },
            meta: {},
          }),
      }),
      confirm
    )
    expect(validResult).toBeNull()

    await validator(
      createMockResponse({
        json: (): Promise<any> =>
          Promise.resolve({
            data: { isValid: true },
            meta: {},
          }),
      }),
      confirm
    )
    expect(validResult).toEqual({
      data: {
        isValid: true,
      },
      meta: {},
    })
  })

  test('awaiting for result: response validator with custom view-model deserializer', async () => {
    const builtInDeserializer: ViewModelDeserializer = (data: string) =>
      JSON.parse(data)

    client = getClient(
      createMockContext('static-path', [
        {
          name: 'built-in-serializer',
          projection: {
            Init: () => null,
          },
          deserializeState: builtInDeserializer,
        },
      ])
    )

    getJson.mockResolvedValueOnce({ data: JSON.stringify({ isValid: false }) })

    await client.query(
      {
        name: 'built-in-serializer',
        aggregateIds: ['1'],
        args: {
          name: 'value',
        },
      },
      {
        waitFor: {
          validator: isEqual.bind(null, {
            data: {
              isValid: true,
            },
            meta: {},
          }),
          attempts: 1,
          period: 1,
        },
      }
    )

    const validator = mRequest.mock.calls[0][3]?.waitForResponse
      ?.validator as Function

    let validResult: string | null = null
    const confirm = (result: string): void => {
      validResult = result
    }

    await validator(
      createMockResponse({
        json: (): Promise<any> =>
          Promise.resolve({
            data: JSON.stringify({ isValid: false }),
            meta: {},
          }),
      }),
      confirm
    )
    expect(validResult).toBeNull()

    await validator(
      createMockResponse({
        json: (): Promise<any> =>
          Promise.resolve({
            data: JSON.stringify({ isValid: true }),
            meta: {},
          }),
      }),
      confirm
    )
    expect(validResult).toEqual({
      data: {
        isValid: true,
      },
      meta: {},
    })
  })

  test('custom query string options passed to request', async () => {
    await client.query(
      {
        name: 'query-name',
        resolver: 'query-resolver',
        args: {
          name: 'value',
        },
      },
      {
        queryStringOptions: {
          arrayFormat: 'comma',
        },
      }
    )
    expect(mRequest).toHaveBeenCalledWith(
      mockContext,
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        queryStringOptions: {
          arrayFormat: 'comma',
        },
      }),
      undefined
    )
  })
})

describe('getStaticAssetUrl', () => {
  /* eslint-disable no-console */
  const consoleError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })
  afterAll(() => {
    console.error = consoleError.bind(console)
  })
  /* eslint-enable no-console */

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

describe('getOriginPath', () => {
  /* eslint-disable no-console */
  const consoleError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })
  afterAll(() => {
    console.error = consoleError.bind(console)
  })
  /* eslint-enable no-console */

  test('path is absolute url', () => {
    expect(
      client.getOriginPath('https://static.host.com/api/commands')
    ).toEqual('https://static.host.com/api/commands')
  })

  test('root based url', () => {
    expect(client.getOriginPath('/api/commands')).toEqual(
      'mock-origin/root-path/api/commands'
    )
  })

  test('path should have leading slash', () => {
    expect(() => client.getOriginPath('api/commands')).toThrow()
  })

  test('empty path', () => {
    expect(() => client.getOriginPath('')).toThrow()
  })
})
