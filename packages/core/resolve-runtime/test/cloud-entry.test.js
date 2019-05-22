import React from 'react'
import { result as IotDataResult } from 'aws-sdk/clients/iotdata'
import { result as LambdaResult } from 'aws-sdk/clients/lambda'
import { result as StepFunctionsResult } from 'aws-sdk/clients/stepfunctions'
import { result as STSResult } from 'aws-sdk/clients/sts'
import { ConcurrentError } from 'resolve-storage-base'
import { CommandError } from 'resolve-command'

import initCloudEntry from '../src/cloud/index'

// TODO. Refactor

describe('Cloud entry', () => {
  let assemblies, constants, domain, redux, routes
  let getCloudEntryWorker, lambdaContext, resolveResult
  let originalMathRandom, originalDateNow, storageAdapter

  const defaultRequestHttpHeaders = {
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en-US; q=0.7, en; q=0.3',
    'Cache-Control': 'no-cache',
    Host: 'aws-gateway-test-host',
    'User-Agent': 'jest/mock'
  }

  const customConstants = {
    customConstantName: 'customConstantValue'
  }
  const staticPath = 'static-path'
  const rootPath = 'root-path'

  const events = []

  beforeEach(async () => {
    let nowTickCounter = 0
    originalMathRandom = Math.random.bind(Math)
    originalDateNow = Date.now.bind(Date)
    Math.random = () => 0.123456789
    Date.now = () => nowTickCounter++

    resolveResult = []

    storageAdapter = {
      loadEvents: jest.fn().mockImplementation(async (filter, callback) => {
        resolveResult.push(['StorageAdapter loadEvents', filter])
        for (const event of events) {
          await Promise.resolve()
          await callback(event)
        }
      }),
      saveEvent: jest.fn().mockImplementation(async event => {
        resolveResult.push(['StorageAdapter saveEvent', event])
      }),
      dispose: jest.fn()
    }

    const snapshotAdapterStore = new Map()

    const snapshotAdapter = {
      loadSnapshot: jest.fn().mockImplementation(async snapshotKey => {
        resolveResult.push(['SnapshotAdapter loadSnapshot', snapshotKey])

        return snapshotAdapterStore.get(snapshotKey)
      }),
      saveSnapshot: jest
        .fn()
        .mockImplementation(async (snapshotKey, snapshotValue) => {
          resolveResult.push([
            'SnapshotAdapter saveSnapshot',
            snapshotKey,
            snapshotValue
          ])

          snapshotAdapterStore.set(snapshotKey, snapshotValue)
        }),
      dispose: jest.fn()
    }

    const defaultReadModelConnector = {
      connect: jest.fn().mockImplementation(async readModelName => {
        resolveResult.push(['DefaultReadModelConnector connect', readModelName])

        return null
      }),
      disconnect: jest.fn().mockImplementation(async (store, readModelName) => {
        resolveResult.push([
          'DefaultReadModelConnector disconnect',
          store,
          readModelName
        ])
      }),
      drop: jest.fn().mockImplementation(async (store, readModelName) => {
        resolveResult.push([
          'DefaultReadModelConnector drop',
          store,
          readModelName
        ])
      }),
      dispose: jest.fn().mockImplementation(async () => {
        resolveResult.push(['DefaultReadModelConnector dispose'])
      })
    }

    assemblies = {
      aggregateActions: {},
      seedClientEnvs: {
        customConstants,
        staticPath,
        rootPath
      },
      storageAdapter: jest.fn().mockReturnValue(storageAdapter),
      snapshotAdapter: jest.fn().mockReturnValue(snapshotAdapter),
      readModelConnectors: {
        default: jest.fn().mockReturnValue(defaultReadModelConnector)
      }
    }

    constants = {
      applicationName: 'application-name',
      distDir: 'dist-dir',
      jwtCookie: {
        cookieOptionName: 'cookie-option-value'
      },
      port: 3000,
      rootPath,
      staticDir: 'static-dir',
      staticPath
    }

    const readModel = {
      name: 'read-model-name',
      connectorName: 'default',
      projection: {},
      resolvers: {
        'resolver-name': jest.fn().mockImplementation(async (store, args) => {
          resolveResult.push([
            'ReadModel "read-model-name" resolver "resolver-name" invoked with',
            store,
            args
          ])

          return JSON.stringify(args)
        })
      }
    }

    const aggregate = {
      name: 'Map',
      commands: {
        set: (aggregateState, command) => {
          return {
            type: 'SET',
            payload: {
              key: command.payload.key,
              value: command.payload.value
            }
          }
        }
      },
      projection: {
        SET: (state, event) => {
          return {
            ...state,
            [event.payload.key]: [event.payload.value]
          }
        }
      },
      serializeState: state => JSON.stringify(state),
      deserializeState: serializedState => JSON.parse(serializedState),
      invariantHash: 'aggregate-invariantHash'
    }

    const apiHandler1 = {
      method: 'POST',
      path: 'my-api-handler-1',
      controller: async (req, res) => {
        res.end('ok')
      }
    }

    const apiHandler2 = {
      method: 'POST',
      path: 'my-api-handler-2',
      controller: async (req, res) => {
        res.end('ok')
      }
    }

    domain = {
      apiHandlers: [apiHandler1, apiHandler2],
      aggregates: [aggregate],
      readModels: [readModel],
      viewModels: [],
      sagas: []
    }

    redux = {
      reducers: {},
      middlewares: [],
      sagas: [],
      enhancers: []
    }

    routes = [
      {
        path: '/',
        component: ({ match, location, history, staticContext }) => (
          <div>
            Index SSR page Match {JSON.stringify(match)}
            Location {JSON.stringify(location)}
            History {JSON.stringify(history)}
            StaticContext {JSON.stringify(staticContext)}
          </div>
        ),
        exact: true
      },
      {
        path: '/',
        component: ({ match, location, history, staticContext }) => (
          <div>
            Error SSR page Match {JSON.stringify(match)}
            Location {JSON.stringify(location)}
            History {JSON.stringify(history)}
            StaticContext {JSON.stringify(staticContext)}
          </div>
        )
      }
    ]

    lambdaContext = {}

    getCloudEntryWorker = async () => {
      return await initCloudEntry({
        assemblies,
        constants,
        domain,
        redux,
        routes
      })
    }
  })

  afterEach(async () => {
    Math.random = originalMathRandom
    Date.now = originalDateNow

    IotDataResult.length = 0
    LambdaResult.length = 0
    StepFunctionsResult.length = 0
    STSResult.length = 0

    getCloudEntryWorker = null
    assemblies = null
    constants = null
    domain = null
    redux = null
    routes = null

    lambdaContext = null
    resolveResult = null
  })

  describe('API gateway event', () => {
    test('should handle URL-addresses outside "rootPath"', async () => {
      const apiGatewayEvent = {
        path: '/',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        queryStringParameters: '',
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should perform SSR on IndexPage on /"rootPath"/', async () => {
      const apiGatewayEvent = {
        path: '/root-path/',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        queryStringParameters: '',
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should perform SSR on ErrorPage on /"rootPath"/non-existing-page', async () => {
      const apiGatewayEvent = {
        path: '/root-path/non-existing-page',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        queryStringParameters: '',
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should invoke existing read-model with existing resolver via GET /"rootPath"/api/query/"readModelName"/"resolverName"?"resolverArgs"', async () => {
      const apiGatewayEvent = {
        path: '/root-path/api/query/read-model-name/resolver-name',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        queryStringParameters: 'key=value',
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should invoke existing read-model with non-existing resolver via GET /"rootPath"/api/query/"readModelName"/"resolverName"?"resolverArgs"', async () => {
      const apiGatewayEvent = {
        path: '/root-path/api/query/read-model-name/non-existing-resolver-name',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        queryStringParameters: 'key=value',
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should invoke non-existing read-model via GET /"rootPath"/api/query/"readModelName"/"resolverName"?"resolverArgs"', async () => {
      const apiGatewayEvent = {
        path:
          '/root-path/api/query/non-existing-read-model-name/non-existing-resolver-name',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        queryStringParameters: 'key=value',
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should fail on invoking read-model without "resolverName" via GET /"rootPath"/api/query/"readModelName"', async () => {
      const apiGatewayEvent = {
        path: '/root-path/api/query/read-model-name',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        queryStringParameters: '',
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should invoke command via POST /"rootPath"/api/commands/', async () => {
      const apiGatewayEvent = {
        path: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8'
        },
        queryStringParameters: '',
        body: JSON.stringify({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key1',
            value: 'value1'
          }
        })
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should fail command via POST /"rootPath"/api/commands/ with ConcurrentError', async () => {
      storageAdapter.saveEvent = jest.fn().mockImplementation(async () => {
        throw new ConcurrentError()
      })

      const apiGatewayEvent = {
        path: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8'
        },
        queryStringParameters: '',
        body: JSON.stringify({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key1',
            value: 'value1'
          }
        })
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should fail command via POST /"rootPath"/api/commands/ with CommandError', async () => {
      storageAdapter.saveEvent = jest.fn().mockImplementation(async () => {
        throw new CommandError()
      })

      const apiGatewayEvent = {
        path: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8'
        },
        queryStringParameters: '',
        body: JSON.stringify({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key1',
            value: 'value1'
          }
        })
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should fail command via POST /"rootPath"/api/commands/ with Error', async () => {
      storageAdapter.saveEvent = jest.fn().mockImplementation(async () => {
        throw new Error()
      })

      const apiGatewayEvent = {
        path: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8'
        },
        queryStringParameters: '',
        body: JSON.stringify({
          aggregateName: 'Map',
          aggregateId: 'aggregateId',
          type: 'set',
          payload: {
            key: 'key1',
            value: 'value1'
          }
        })
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should get subscribe options via GET /"rootPath"/api/subscribe/', async () => {
      const apiGatewayEvent = {
        path: '/root-path/api/subscribe',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        queryStringParameters: '',
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should get subscribe options via POST /"rootPath"/api/subscribe/', async () => {
      const apiGatewayEvent = {
        path: '/root-path/api/subscribe',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8'
        },
        queryStringParameters: '',
        body: JSON.stringify({})
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should get subscribe options via POST /"rootPath"/api/my-api-handler-1/', async () => {
      const apiGatewayEvent = {
        path: '/root-path/api/my-api-handler-2',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8'
        },
        queryStringParameters: '',
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should redirect from /"rootPath" to /"rootPath"/', async () => {
      const apiGatewayEvent = {
        path: '/root-path',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders
        },
        queryStringParameters: '',
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })

    test('should set header Bearer when jwt provided', async () => {
      const apiGatewayEvent = {
        path: '/root-path',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          authorization: 'Bearer JWT'
        },
        queryStringParameters: '',
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(IotDataResult).toMatchSnapshot()
      expect(LambdaResult).toMatchSnapshot()
      expect(StepFunctionsResult).toMatchSnapshot()
      expect(STSResult).toMatchSnapshot()

      expect(resolveResult).toMatchSnapshot()
      expect(result).toMatchSnapshot()
    })
  })
})
