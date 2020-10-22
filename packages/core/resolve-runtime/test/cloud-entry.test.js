import STS from 'aws-sdk/clients/sts'
import { ConcurrentError } from 'resolve-eventstore-base'

import initCloudEntry from '../src/cloud/index'

describe('Cloud entry', () => {
  let assemblies, constants, domain, redux, routes
  let getCloudEntryWorker, lambdaContext
  let originalMathRandom, originalDateNow, originalProcessEnv
  let eventstoreAdapter, snapshotAdapter

  const defaultRequestHttpHeaders = [
    { key: 'Accept', value: '*/*' },
    { key: 'Accept-Encoding', value: 'gzip, deflate' },
    { key: 'Accept-Language', value: 'en-US; q=0.7, en; q=0.3' },
    { key: 'Cache-Control', value: 'no-cache' },
    { key: 'Host', value: 'aws-cloud-front-test-host' },
    { key: 'User-Agent', value: 'jest/mock' },
  ]

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
      schedulers: [],
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

  describe('CloudFront event', () => {
    test('should handle URL-addresses outside "rootPath"', async () => {
      const cloudFrontEvent = {
        uri: '/',
        httpMethod: 'GET',
        headers: [...defaultRequestHttpHeaders],
        querystring: 'a=b&c=d',
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(cloudFrontEvent, lambdaContext)

      expect(result).toEqual({
        body: Buffer.from(
          'Access error: GET "/" is not addressable by current executor',
          'utf8'
        ).toString('base64'),
        headers: [],
        httpStatus: 405,
        httpStatusText: 'Method Not Allowed',
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

      const cloudFrontEvent = {
        uri: '/root-path/api/query/read-model-name/resolver-name',
        httpMethod: 'GET',
        headers: [...defaultRequestHttpHeaders],
        querystring: 'a=b&c=d',
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(cloudFrontEvent, lambdaContext)

      expect(result).toEqual({
        body: Buffer.from(
          JSON.stringify(
            {
              data: {
                a: 'b',
                c: 'd',
              },
            },
            null,
            2
          ),
          'utf8'
        ).toString('base64'),
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        httpStatus: 200,
        httpStatusText: 'OK',
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

      const cloudFrontEvent = {
        uri: '/root-path/api/query/read-model-name/non-existing-resolver-name',
        httpMethod: 'GET',
        headers: [...defaultRequestHttpHeaders],
        querystring: 'key=value',
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(cloudFrontEvent, lambdaContext)

      expect(result).toEqual({
        body: Buffer.from(
          'Resolver "non-existing-resolver-name" does not exist',
          'utf8'
        ).toString('base64'),
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
        httpStatus: 422,
        httpStatusText: 'Unprocessable Entity',
      })

      expect(readModelConnector.connect.mock.calls.length).toEqual(0)
      expect(readModelConnector.disconnect.mock.calls.length).toEqual(0)
      expect(readModelConnector.drop.mock.calls.length).toEqual(0)
      expect(readModelConnector.dispose.mock.calls.length).toEqual(1)
    })

    test('should invoke non-existing read-model via GET /"rootPath"/api/query/"readModelName"/"resolverName"?"resolverArgs"', async () => {
      const cloudFrontEvent = {
        uri:
          '/root-path/api/query/non-existing-read-model-name/non-existing-resolver-name',
        httpMethod: 'GET',
        headers: [...defaultRequestHttpHeaders],
        querystring: 'key=value',
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(cloudFrontEvent, lambdaContext)

      expect(result).toEqual({
        body: Buffer.from(
          'Read/view model "non-existing-read-model-name" does not exist',
          'utf8'
        ).toString('base64'),
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
        httpStatus: 422,
        httpStatusText: 'Unprocessable Entity',
      })
    })

    test('should fail on invoking read-model without "resolverName" via GET /"rootPath"/api/query/"readModelName"', async () => {
      const cloudFrontEvent = {
        uri: '/root-path/api/query/read-model-name',
        httpMethod: 'GET',
        headers: [...defaultRequestHttpHeaders],
        querystring: 'key=value',
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(cloudFrontEvent, lambdaContext)

      expect(result).toEqual({
        body: Buffer.from(
          'Invalid "modelName" and/or "modelOptions" parameters',
          'utf8'
        ).toString('base64'),
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
        httpStatus: 400,
        httpStatusText: 'Bad Request',
      })
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

      const cloudFrontEvent = {
        uri: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: [
          ...defaultRequestHttpHeaders,
          {
            key: 'Content-Type',
            value: 'application/json; charset=utf-8',
          },
        ],
        querystring: 'key=value',
        body: Buffer.from(
          JSON.stringify({
            aggregateName: 'Map',
            aggregateId: 'aggregateId',
            type: 'set',
            payload: {
              key: 'key1',
              value: 'value1',
            },
          }),
          'utf8'
        ).toString('base64'),
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(cloudFrontEvent, lambdaContext)

      expect(result).toEqual({
        body: Buffer.from(
          JSON.stringify(
            {
              aggregateId: 'aggregateId',
              aggregateVersion: 1,
              timestamp: 1,
              type: 'SET',
              payload: {
                key: 'key1',
                value: 'value1',
              },
            },
            null,
            2
          ),
          'utf8'
        ).toString('base64'),
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
        httpStatus: 200,
        httpStatusText: 'OK',
      })
    })

    test('should fail command via POST /"rootPath"/api/commands/ with ConcurrentError', async () => {
      const aggregate = {
        encryption: () => ({}),
        name: 'Map',
        commands: {
          set: () => {
            throw new ConcurrentError('aggregateId')
          },
        },
        serializeState: (state) => JSON.stringify(state),
        deserializeState: (serializedState) => JSON.parse(serializedState),
        invariantHash: 'aggregate-invariantHash',
      }

      domain.aggregates.push(aggregate)

      const cloudFrontEvent = {
        uri: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: [
          ...defaultRequestHttpHeaders,
          {
            key: 'Content-Type',
            value: 'application/json; charset=utf-8',
          },
        ],
        querystring: 'key=value',
        body: Buffer.from(
          JSON.stringify({
            aggregateName: 'Map',
            aggregateId: 'aggregateId',
            type: 'set',
            payload: {
              key: 'key1',
              value: 'value1',
            },
          }),
          'utf8'
        ).toString('base64'),
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(cloudFrontEvent, lambdaContext)

      expect(result).toEqual({
        body: Buffer.from(
          "Command error: Can not save the event because aggregate 'aggregateId' is not actual at the moment. Please retry later.",
          'utf8'
        ).toString('base64'),
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
        httpStatus: 409,
        httpStatusText: 'Conflict',
      })
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

      const cloudFrontEvent = {
        uri: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: [
          ...defaultRequestHttpHeaders,
          {
            key: 'Content-Type',
            value: 'application/json; charset=utf-8',
          },
        ],
        querystring: 'key=value',
        body: Buffer.from(
          JSON.stringify({
            aggregateName: 'BadAggregate',
            aggregateId: 'aggregateId',
            type: 'fail',
          }),
          'utf8'
        ).toString('base64'),
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(cloudFrontEvent, lambdaContext)

      expect(result).toEqual({
        body: Buffer.from(
          'Command error: Event "type" is required',
          'utf8'
        ).toString('base64'),
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
        httpStatus: 400,
        httpStatusText: 'Bad Request',
      })
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

      const cloudFrontEvent = {
        uri: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: [
          ...defaultRequestHttpHeaders,
          {
            key: 'Content-Type',
            value: 'application/json; charset=utf-8',
          },
        ],
        querystring: 'key=value',
        body: Buffer.from(
          JSON.stringify({
            aggregateName: 'BadAggregate',
            aggregateId: 'aggregateId',
            type: 'fail',
          }),
          'utf8'
        ).toString('base64'),
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(cloudFrontEvent, lambdaContext)

      expect(result).toEqual({
        body: Buffer.from('Command error: I’m a teapot', 'utf8').toString(
          'base64'
        ),
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
        httpStatus: 418,
        httpStatusText: "I'm a teapot",
      })
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

      const cloudFrontEvent = {
        uri: '/root-path/api/my-api-handler-2',
        httpMethod: 'POST',
        headers: [
          ...defaultRequestHttpHeaders,
          {
            key: 'Content-Type',
            value: 'application/json; charset=utf-8',
          },
        ],
        querystring: 'key=value',
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(cloudFrontEvent, lambdaContext)

      expect(result).toEqual({
        body: Buffer.from('ok', 'utf8').toString('base64'),
        headers: [
          {
            key: 'Content-type',
            value: 'text/plain',
          },
        ],
        httpStatus: 200,
        httpStatusText: 'OK',
      })
    })

    test('should redirect from /"rootPath" to /"rootPath"/', async () => {
      domain.apiHandlers.push({
        method: 'POST',
        path: '/',
        handler: async (req, res) => {
          res.end('Custom markup handler')
        },
      })

      const cloudFrontEvent = {
        uri: '/root-path',
        httpMethod: 'POST',
        headers: [...defaultRequestHttpHeaders],
        querystring: 'key=value',
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(cloudFrontEvent, lambdaContext)

      expect(result).toEqual({
        body: '',
        headers: [
          {
            key: 'Location',
            value: '/root-path/',
          },
        ],
        httpStatus: 302,
        httpStatusText: 'Moved Temporarily',
      })
    })

    test('should set header Bearer when jwt provided', async () => {
      domain.apiHandlers.push({
        method: 'POST',
        path: '/',
        handler: async (req, res) => {
          res.end('Custom markup handler')
        },
      })

      const cloudFrontEvent = {
        uri: '/root-path',
        httpMethod: 'POST',
        headers: [
          ...defaultRequestHttpHeaders,
          {
            key: 'authorization',
            value: 'Bearer JWT',
          },
        ],
        querystring: 'key=value',
        body: null,
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(cloudFrontEvent, lambdaContext)

      expect(result).toEqual({
        body: '',
        headers: [
          {
            key: 'Authorization',
            value: 'Bearer JWT',
          },
          {
            key: 'Location',
            value: '/root-path/',
          },
        ],
        httpStatus: 302,
        httpStatusText: 'Moved Temporarily',
      })
    })
  })
})
