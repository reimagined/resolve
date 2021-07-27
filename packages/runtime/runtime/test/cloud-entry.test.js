import STS from 'aws-sdk/clients/sts'
import { ConcurrentError } from '@resolve-js/eventstore-base'

import initCloudEntry from '../src/cloud/index'

jest.mock('../src/common/utils/pure-require.js', () => ({
  default: require,
}))

describe('Cloud entry', () => {
  let assemblies, constants, domain, redux, routes
  let getCloudEntryWorker, lambdaContext
  let originalMathRandom, originalDateNow, originalProcessEnv
  let eventstoreAdapter, snapshotAdapter

  const defaultRequestHttpHeaders = {
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en-US; q=0.7, en; q=0.3',
    'Cache-Control': 'no-cache',
    Host: 'aws-gateway-test-host',
    'User-Agent': 'jest/mock',
  }

  const customConstants = {
    customConstantName: 'customConstantValue',
  }
  const staticPath = 'static-path'
  const rootPath = 'root-path'

  beforeEach(async () => {
    let nowTickCounter = 0
    originalMathRandom = Math.random.bind(Math)
    originalDateNow = Date.now.bind(Date)
    originalProcessEnv = process.env

    Math.random = () => 0.123456789
    Date.now = () => nowTickCounter++
    process.env = {
      RESOLVE_DEPLOYMENT_ID: 'RESOLVE_DEPLOYMENT_ID',
      RESOLVE_WS_ENDPOINT: 'RESOLVE_WS_ENDPOINT',
      RESOLVE_IOT_ROLE_ARN: 'RESOLVE_IOT_ROLE_ARN',
    }

    eventstoreAdapter = {
      getSecretsManager: jest.fn().mockReturnValue({}),
      loadEvents: jest.fn().mockReturnValue({ events: [], cursor: null }),
      ensureEventSubscriber: jest.fn().mockReturnValue(Promise.resolve()),
      removeEventSubscriber: jest.fn().mockReturnValue(Promise.resolve()),
      getEventSubscribers: jest.fn().mockReturnValue(Promise.resolve([])),
      getNextCursor: jest.fn(),
      getLatestEvent: jest.fn(),
      saveEvent: jest.fn(),
      dispose: jest.fn(),
      import: jest.fn(),
      export: jest.fn(),
    }

    snapshotAdapter = {
      loadSnapshot: jest.fn(),
      saveSnapshot: jest.fn(),
      dispose: jest.fn(),
    }

    assemblies = {
      seedClientEnvs: {
        customConstants,
        staticPath,
        rootPath,
      },
      eventstoreAdapter: jest.fn().mockImplementation(() => eventstoreAdapter),
      snapshotAdapter: jest.fn().mockImplementation(() => snapshotAdapter),
      readModelConnectors: {
        // default: jest.fn().mockReturnValue(defaultReadModelConnector)
      },
    }

    constants = {
      eventSubscriberScope: 'deployment-id',
      applicationName: 'application-name',
      distDir: 'dist-dir',
      jwtCookie: {
        cookieOptionName: 'cookie-option-value',
      },
      port: 3000,
      rootPath,
      staticDir: 'static-dir',
      staticPath,
    }

    domain = {
      eventListeners: new Map(),
      apiHandlers: [
        /*apiHandler1, apiHandler2*/
      ],
      aggregates: [
        /*aggregate*/
      ],
      readModels: [
        /*readModel*/
      ],
      viewModels: [],
      sagas: [],
    }

    redux = {
      reducers: {},
      middlewares: [],
      sagas: [],
      enhancers: [],
    }

    routes = []

    lambdaContext = {
      getRemainingTimeInMillis: () => 0x7fffffff,
      invokedFunctionArn: '',
    }

    getCloudEntryWorker = async () => {
      return await initCloudEntry({
        assemblies,
        constants,
        domain,
        redux,
        routes,
      })
    }
  })

  afterEach(async () => {
    Math.random = originalMathRandom
    Date.now = originalDateNow
    process.env = originalProcessEnv

    getCloudEntryWorker = null
    assemblies = null
    constants = null
    domain = null
    redux = null
    routes = null

    snapshotAdapter = null

    lambdaContext = null

    STS.assumeRole.mockReset()
  })

  describe('API gateway event', () => {
    test('should handle URL-addresses outside "rootPath"', async () => {
      const apiGatewayEvent = {
        path: '/',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        multiValueQueryStringParameters: {},
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result).toEqual({
        statusCode: 405,
        headers: {},
        body: 'Access error: GET "/" is not addressable by current executor',
      })
    })

    test('should invoke existing read-model with existing resolver via GET /"rootPath"/api/query/"readModelName"/"resolverName"?"resolverArgs"', async () => {
      const readModel = {
        name: 'read-model-name',
        connectorName: 'default',
        projection: {},
        resolvers: {
          'resolver-name': jest.fn().mockImplementation(async (store, args) => {
            return args
          }),
        },
      }

      const readModelConnector = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        drop: jest.fn(),
        dispose: jest.fn(),
      }

      domain.readModels.push(readModel)
      assemblies.readModelConnectors['default'] = () => readModelConnector

      const apiGatewayEvent = {
        path: '/root-path/api/query/read-model-name/resolver-name',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        multiValueQueryStringParameters: {
          key: 'value',
        },
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(200)
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' })
      expect(JSON.parse(result.body)).toEqual({
        data: {
          key: 'value',
        },
      })

      expect(readModelConnector.connect.mock.calls[0][0]).toEqual(
        'read-model-name'
      )
      expect(readModelConnector.disconnect.mock.calls[0][1]).toEqual(
        'read-model-name'
      )
      expect(readModelConnector.disconnect.mock.calls[0].length).toEqual(2)
      expect(readModelConnector.drop.mock.calls.length).toEqual(0)
      expect(readModelConnector.dispose.mock.calls.length).toEqual(1)
    })

    test('should invoke existing read-model with non-existing resolver via GET /"rootPath"/api/query/"readModelName"/"resolverName"?"resolverArgs"', async () => {
      const readModel = {
        name: 'read-model-name',
        connectorName: 'default',
        projection: {},
        resolvers: {
          'resolver-name': jest.fn().mockImplementation(async (store, args) => {
            return args
          }),
        },
      }

      const readModelConnector = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        drop: jest.fn(),
        dispose: jest.fn(),
      }

      domain.readModels.push(readModel)
      assemblies.readModelConnectors['default'] = () => readModelConnector

      const apiGatewayEvent = {
        path: '/root-path/api/query/read-model-name/non-existing-resolver-name',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        multiValueQueryStringParameters: {
          key: 'value',
        },
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(422)
      expect(result.headers).toEqual({ 'Content-Type': 'text/plain' })
      expect(result.body).toEqual(
        'Resolver "non-existing-resolver-name" does not exist'
      )

      expect(readModelConnector.connect.mock.calls.length).toEqual(0)
      expect(readModelConnector.disconnect.mock.calls.length).toEqual(0)
      expect(readModelConnector.drop.mock.calls.length).toEqual(0)
      expect(readModelConnector.dispose.mock.calls.length).toEqual(1)
    })

    test('should invoke non-existing read-model via GET /"rootPath"/api/query/"readModelName"/"resolverName"?"resolverArgs"', async () => {
      const apiGatewayEvent = {
        path:
          '/root-path/api/query/non-existing-read-model-name/non-existing-resolver-name',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        multiValueQueryStringParameters: { key: 'value' },
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(422)
      expect(result.headers).toEqual({ 'Content-Type': 'text/plain' })
      expect(result.body).toEqual(
        'Read/view model "non-existing-read-model-name" does not exist'
      )
    })

    test('should fail on invoking read-model without "resolverName" via GET /"rootPath"/api/query/"readModelName"', async () => {
      const apiGatewayEvent = {
        path: '/root-path/api/query/read-model-name',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        multiValueQueryStringParameters: {},
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(400)
      expect(result.headers).toEqual({ 'Content-Type': 'text/plain' })
      expect(result.body).toEqual(
        'Invalid "modelName" and/or "modelOptions" parameters'
      )
    })

    test('should invoke command via POST /"rootPath"/api/commands/', async () => {
      const aggregate = {
        encryption: () => ({}),
        name: 'Map',
        commands: {
          set: (aggregateState, command) => {
            return {
              type: 'SET',
              payload: {
                key: command.payload.key,
                value: command.payload.value,
              },
            }
          },
        },
        projection: {
          SET: (state, event) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value],
            }
          },
        },
        serializeState: (state) => JSON.stringify(state),
        deserializeState: (serializedState) => JSON.parse(serializedState),
        invariantHash: 'aggregate-invariantHash',
      }

      domain.aggregates.push(aggregate)

      const apiGatewayEvent = {
        path: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8',
        },
        multiValueQueryStringParameters: {},
        body: JSON.stringify({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key1',
            value: 'value1',
          },
        }),
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)
      expect(result.statusCode).toEqual(200)
      expect(result.headers).toEqual({ 'Content-Type': 'text/plain' })
      expect(JSON.parse(result.body)).toEqual({
        aggregateId: 'aggregateId',
        aggregateVersion: 1,
        timestamp: 2,
        type: 'SET',
        payload: {
          key: 'key1',
          value: 'value1',
        },
      })
    })

    test('should fail command via POST /"rootPath"/api/commands/ with ConcurrentError', async () => {
      const aggregate = {
        encryption: () => ({}),
        name: 'Map',
        commands: {
          set: () => {
            throw new ConcurrentError()
          },
        },
        serializeState: (state) => JSON.stringify(state),
        deserializeState: (serializedState) => JSON.parse(serializedState),
        invariantHash: 'aggregate-invariantHash',
      }

      domain.aggregates.push(aggregate)

      const apiGatewayEvent = {
        path: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8',
        },
        multiValueQueryStringParameters: '',
        body: JSON.stringify({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key1',
            value: 'value1',
          },
        }),
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(409)
      expect(result.headers).toEqual({ 'Content-Type': 'text/plain' })
      expect(result.body).toContain('is currently out of date')
    })

    test('should fail command via POST /"rootPath"/api/commands/ with CommandError', async () => {
      eventstoreAdapter.saveEvent = jest.fn().mockImplementation(async () => {
        throw new ConcurrentError()
      })

      const aggregate = {
        encryption: () => ({}),
        name: 'BadAggregate',
        commands: {
          fail: () => {
            return {
              // BAD EVENT
            }
          },
        },
      }

      domain.aggregates.push(aggregate)

      const apiGatewayEvent = {
        path: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8',
        },
        multiValueQueryStringParameters: {},
        body: JSON.stringify({
          aggregateName: 'BadAggregate',
          aggregateId: 'aggregateId',
          type: 'fail',
        }),
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(400)
      expect(result.headers).toEqual({ 'Content-Type': 'text/plain' })
      expect(result.body).toEqual('Command error: Event "type" is required')
    })

    test('should fail command via POST /"rootPath"/api/commands/ with CustomerError', async () => {
      eventstoreAdapter.saveEvent = jest.fn().mockImplementation(async () => {
        throw new ConcurrentError()
      })

      const aggregate = {
        encryption: () => ({}),
        name: 'BadAggregate',
        commands: {
          fail: () => {
            const error = new Error('I’m a teapot')
            error.code = 418
            throw error
          },
        },
      }

      domain.aggregates.push(aggregate)

      const apiGatewayEvent = {
        path: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8',
        },
        multiValueQueryStringParameters: {},
        body: JSON.stringify({
          aggregateName: 'BadAggregate',
          aggregateId: 'aggregateId',
          type: 'fail',
        }),
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(418)
      expect(result.headers).toEqual({ 'Content-Type': 'text/plain' })
      expect(result.body).toEqual('Command error: I’m a teapot')
    })

    test('should get subscribe options via POST /"rootPath"/api/my-api-handler-1/', async () => {
      domain.apiHandlers.push(
        {
          method: 'POST',
          path: '/api/my-api-handler-1',
          handler: async (req, res) => {
            res.setHeader('Content-type', 'application/octet-stream')
            res.end('Custom octet stream')
          },
        },
        {
          method: 'POST',
          path: '/api/my-api-handler-2',
          handler: async (req, res) => {
            res.setHeader('Content-type', 'text/plain')
            res.end('ok')
          },
        }
      )

      const apiGatewayEvent = {
        path: '/root-path/api/my-api-handler-2',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8',
        },
        multiValueQueryStringParameters: '',
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(200)
      expect(result.headers).toEqual({ 'Content-Type': 'text/plain' })
      expect(result.body).toEqual('ok')
    })

    test('should redirect from /"rootPath" to /"rootPath"/', async () => {
      domain.apiHandlers.push({
        method: 'POST',
        path: '/',
        handler: async (req, res) => {
          res.end('Custom markup handler')
        },
      })

      const apiGatewayEvent = {
        path: '/root-path',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
        },
        multiValueQueryStringParameters: '',
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(302)
      expect(result.headers).toEqual({ Location: '/root-path/' })
      expect(result.body).toEqual('')
    })

    test('should set header Bearer when jwt provided', async () => {
      domain.apiHandlers.push({
        method: 'POST',
        path: '/',
        handler: async (req, res) => {
          res.end('Custom markup handler')
        },
      })

      const apiGatewayEvent = {
        path: '/root-path',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          authorization: 'Bearer JWT',
        },
        multiValueQueryStringParameters: '',
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(302)
      expect(result.headers).toEqual({
        Authorization: 'Bearer JWT',
        Location: '/root-path/',
      })
      expect(result.body).toEqual('')
    })
  })
})
