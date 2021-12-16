import { mocked } from 'ts-jest/utils'
import STS from 'aws-sdk/clients/sts'
import {
  ConcurrentError,
  Adapter as EventStoreAdapter,
} from '@resolve-js/eventstore-base'
import runtimeFactory from '../src/index'

import type {
  Assemblies,
  BuildTimeConstants,
  RuntimeWorker,
  UploaderPool,
} from '@resolve-js/runtime-base'
import type {
  ApiGatewayLambdaEvent,
  LambdaContext,
  WorkerArguments,
  WorkerResult,
} from '../src/types'
import type {
  Command,
  ReadModelMeta,
  Event,
  AggregateMeta,
  DomainMeta,
} from '@resolve-js/core'

const originalMathRandom = Math.random.bind(Math)
const originalDateNow = Date.now.bind(Date)
const originalProcessEnv = process.env

const mAssumeRole = mocked(STS.prototype.assumeRole)

describe('runtime', () => {
  let constants: BuildTimeConstants
  let assemblies: Assemblies
  let domain: DomainMeta
  let uploadAdapter: UploaderPool
  let eventStoreAdapter: EventStoreAdapter
  let lambdaContext: LambdaContext
  let getCloudEntryWorker: () => Promise<
    RuntimeWorker<WorkerArguments, WorkerResult>
  >

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
    Math.random = () => 0.123456789
    Date.now = () => nowTickCounter++
    process.env = {
      RESOLVE_DEPLOYMENT_ID: 'RESOLVE_DEPLOYMENT_ID',
      RESOLVE_WS_ENDPOINT: 'RESOLVE_WS_ENDPOINT',
      RESOLVE_IOT_ROLE_ARN: 'RESOLVE_IOT_ROLE_ARN',
    }

    eventStoreAdapter = {
      beginIncrementalImport: jest.fn(),
      commitIncrementalImport: jest.fn(),
      describe: jest.fn(),
      drop: jest.fn(),
      dropSnapshot: jest.fn(),
      exportEvents: jest.fn(),
      exportSecrets: jest.fn(),
      freeze: jest.fn(),
      gatherSecretsFromEvents: jest.fn(),
      getCursorUntilEventTypes: jest.fn(),
      getReplicationState: jest.fn(),
      importEvents: jest.fn(),
      importSecrets: jest.fn(),
      incrementalImport: jest.fn(),
      init: jest.fn(),
      loadSecrets: jest.fn(),
      loadSnapshot: jest.fn(),
      pushIncrementalImport: jest.fn(),
      replicateEvents: jest.fn(),
      replicateSecrets: jest.fn(),
      resetReplication: jest.fn(),
      setReplicationLock: jest.fn(),
      rollbackIncrementalImport: jest.fn(),
      saveSnapshot: jest.fn(),
      setReplicationPaused: jest.fn(),
      setReplicationStatus: jest.fn(),
      unfreeze: jest.fn(),
      getSecretsManager: jest.fn().mockReturnValue({}),
      loadEvents: jest.fn().mockReturnValue({ events: [], cursor: null }),
      ensureEventSubscriber: jest.fn().mockReturnValue(Promise.resolve()),
      removeEventSubscriber: jest.fn().mockReturnValue(Promise.resolve()),
      getEventSubscribers: jest.fn().mockReturnValue(Promise.resolve([])),
      getNextCursor: jest.fn(),
      getLatestEvent: jest.fn(),
      saveEvent: jest
        .fn()
        .mockImplementation((event) => ({ event, cursor: null })),
      dispose: jest.fn(),
      establishTimeLimit: jest.fn(),
      getEventLoader: jest.fn(),
    }

    uploadAdapter = {}

    assemblies = {
      seedClientEnvs: {
        customConstants,
        staticPath,
        rootPath,
      },
      eventstoreAdapter: jest.fn().mockImplementation(() => eventStoreAdapter),
      readModelConnectors: {
        // default: jest.fn().mockReturnValue(defaultReadModelConnector)
      },
      serverImports: null,
      uploadAdapter: jest.fn().mockImplementation(() => uploadAdapter),
      monitoringAdapters: {},
    }

    constants = {
      applicationName: 'application-name',
      distDir: 'dist-dir',
      jwtCookie: {
        name: 'cookie-option-value',
        maxAge: Number.POSITIVE_INFINITY,
      },
      rootPath,
      staticDir: 'static-dir',
      staticPath,
    }

    domain = {
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

    lambdaContext = {
      getRemainingTimeInMillis: () => 0x7fffffff,
      invokedFunctionArn: '',
      callbackWaitsForEmptyEventLoop: true,
      functionName: 'lambda',
      Records: [],
    }

    const { entry } = runtimeFactory({})

    getCloudEntryWorker = async () => {
      return await entry({
        assemblies,
        constants,
        domain,
        resolveVersion: '0.0.1',
      })
    }
  })

  afterEach(async () => {
    Math.random = originalMathRandom
    Date.now = originalDateNow
    process.env = originalProcessEnv
    mAssumeRole.mockClear()
  })

  describe('API gateway event', () => {
    test('should handle URL-addresses outside "rootPath"', async () => {
      const apiGatewayEvent: ApiGatewayLambdaEvent = {
        resolveSource: 'None',
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
        body: 'GET "/": handler not exist',
      })
    })

    test('should invoke existing read-model with existing resolver via GET /"rootPath"/api/query/"readModelName"/"resolverName"?"resolverArgs"', async () => {
      const readModel: ReadModelMeta = {
        name: 'read-model-name',
        connectorName: 'default',
        projection: {},
        resolvers: {
          'resolver-name': jest.fn().mockImplementation(async (store, args) => {
            return args
          }),
        },
        encryption: async () => ({
          encrypt: () => '',
          decrypt: () => '',
        }),
      }

      const readModelConnector = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        drop: jest.fn(),
        dispose: jest.fn(),
      }

      domain.readModels.push(readModel)
      assemblies.readModelConnectors['default'] = () => readModelConnector

      const apiGatewayEvent: ApiGatewayLambdaEvent = {
        resolveSource: 'None',
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
      expect(JSON.parse(result.body ?? '')).toEqual({
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
        encryption: async () => ({
          encrypt: () => '',
          decrypt: () => '',
        }),
      }

      const readModelConnector = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        drop: jest.fn(),
        dispose: jest.fn(),
      }

      domain.readModels.push(readModel)
      assemblies.readModelConnectors['default'] = () => readModelConnector

      const apiGatewayEvent: ApiGatewayLambdaEvent = {
        resolveSource: 'None',
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
      const apiGatewayEvent: ApiGatewayLambdaEvent = {
        resolveSource: 'None',
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
      const apiGatewayEvent: ApiGatewayLambdaEvent = {
        resolveSource: 'None',
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

    test.skip('should invoke command via POST /"rootPath"/api/commands/', async () => {
      const aggregate: AggregateMeta = {
        encryption: async () => ({
          encrypt: () => '',
          decrypt: () => '',
        }),
        name: 'Map',
        commands: {
          set: (aggregateState: any, command: Command) => {
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
          SET: (state: any, event: Event) => {
            return {
              ...state,
              [event.payload.key]: [event.payload.value],
            }
          },
        },
        serializeState: (state: any) => JSON.stringify(state),
        deserializeState: (serializedState: string) =>
          JSON.parse(serializedState),
        invariantHash: 'aggregate-invariantHash',
      }

      domain.aggregates.push(aggregate)

      const apiGatewayEvent: ApiGatewayLambdaEvent = {
        resolveSource: 'None',
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
      expect(JSON.parse(result.body ?? '')).toEqual({
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
      const aggregate: AggregateMeta = {
        encryption: async () => ({
          encrypt: () => '',
          decrypt: () => '',
        }),
        name: 'Map',
        commands: {
          set: () => {
            throw new ConcurrentError('aggregate-id')
          },
        },
        projection: {},
        serializeState: (state: any) => JSON.stringify(state),
        deserializeState: (serializedState: string) =>
          JSON.parse(serializedState),
        invariantHash: 'aggregate-invariantHash',
      }

      domain.aggregates.push(aggregate)

      const apiGatewayEvent: ApiGatewayLambdaEvent = {
        resolveSource: 'None',
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

      expect(result.statusCode).toEqual(409)
      expect(result.headers).toEqual({ 'Content-Type': 'text/plain' })
      expect(result.body).toContain('is currently out of date')
    })

    test.skip('should fail command via POST /"rootPath"/api/commands/ with CommandError', async () => {
      eventStoreAdapter.saveEvent = jest.fn().mockImplementation(async () => {
        throw new ConcurrentError('aggregate-id')
      })

      const aggregate: AggregateMeta = {
        encryption: async () => ({
          encrypt: () => '',
          decrypt: () => '',
        }),
        name: 'BadAggregate',
        commands: {
          fail: () => {
            return {
              type: 'BAD_EVENT',
              payload: {},
            }
          },
        },
        projection: {},
        serializeState: (state: any) => JSON.stringify(state),
        deserializeState: (serializedState: string) =>
          JSON.parse(serializedState),
        invariantHash: 'aggregate-hash',
      }

      domain.aggregates.push(aggregate)

      const apiGatewayEvent: ApiGatewayLambdaEvent = {
        resolveSource: 'None',
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

    test.skip('should fail command via POST /"rootPath"/api/commands/ with CustomerError', async () => {
      eventStoreAdapter.saveEvent = jest.fn().mockImplementation(async () => {
        throw new ConcurrentError('aggregate-id')
      })

      const aggregate: AggregateMeta = {
        encryption: async () => ({
          encrypt: () => '',
          decrypt: () => '',
        }),
        name: 'BadAggregate',
        commands: {
          fail: () => {
            const error = new Error('I’m a teapot') as any
            error.code = 418
            throw error
          },
        },
        projection: {},
        serializeState: (state: any) => JSON.stringify(state),
        deserializeState: (serializedState: string) =>
          JSON.parse(serializedState),
      }

      domain.aggregates.push(aggregate)

      const apiGatewayEvent: ApiGatewayLambdaEvent = {
        resolveSource: 'None',
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

      const apiGatewayEvent: ApiGatewayLambdaEvent = {
        resolveSource: 'None',
        path: '/root-path/api/my-api-handler-2',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8',
        },
        multiValueQueryStringParameters: {},
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

      const apiGatewayEvent: ApiGatewayLambdaEvent = {
        resolveSource: 'None',
        path: '/root-path',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
        },
        multiValueQueryStringParameters: {},
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

      const apiGatewayEvent: ApiGatewayLambdaEvent = {
        resolveSource: 'None',
        path: '/root-path',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          authorization: 'Bearer JWT',
        },
        multiValueQueryStringParameters: {},
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
