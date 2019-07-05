import React from 'react'
import STS from 'aws-sdk/clients/sts'
import { ConcurrentError } from 'resolve-storage-base'

import initCloudEntry from '../src/cloud/index'

describe('Cloud entry', () => {
  let assemblies, constants, domain, redux, routes
  let getCloudEntryWorker, lambdaContext
  let originalMathRandom, originalDateNow, storageAdapter, snapshotAdapter
  let originalProcessEnv

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
      RESOLVE_IOT_ROLE_ARN: 'RESOLVE_IOT_ROLE_ARN'
    }

    storageAdapter = {
      loadEvents: jest.fn(),
      saveEvent: jest.fn(),
      dispose: jest.fn()
    }

    snapshotAdapter = {
      loadSnapshot: jest.fn(),
      saveSnapshot: jest.fn(),
      dispose: jest.fn()
    }

    assemblies = {
      aggregateActions: {},
      seedClientEnvs: {
        customConstants,
        staticPath,
        rootPath
      },
      storageAdapter: jest.fn().mockImplementation(() => storageAdapter),
      snapshotAdapter: jest.fn().mockImplementation(() => snapshotAdapter),
      readModelConnectors: {
        // default: jest.fn().mockReturnValue(defaultReadModelConnector)
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
      sagas: []
    }

    redux = {
      reducers: {},
      middlewares: [],
      sagas: [],
      enhancers: []
    }

    routes = []

    lambdaContext = {
      getRemainingTimeInMillis: () => 0x7fffffff
    }

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
        queryStringParameters: {},
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result).toEqual({
        statusCode: 405,
        headers: {},
        body: 'Access error: path "/" is not addressable by current executor'
      })
    })

    test('should perform SSR on IndexPage on /"rootPath"/', async () => {
      routes.push({
        path: '/',
        component: ({ match, location, history }) => (
          <div>
            Index SSR page Match {JSON.stringify(match)}
            Location {JSON.stringify(location)}
            History {JSON.stringify(history)}
          </div>
        ),
        exact: true
      })

      const apiGatewayEvent = {
        path: '/root-path/',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        queryStringParameters: {},
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(200)
      expect(result.headers).toEqual({ 'Content-Type': 'text/html' })
      expect(result.body).toMatch('Index SSR page Match')
      expect(result.body).toMatch('Location')
      expect(result.body).toMatch('History')
    })

    test('should perform SSR on ErrorPage on /"rootPath"/non-existing-page', async () => {
      routes.push({
        path: '/',
        component: ({ match, location, history }) => (
          <div>
            Error SSR page Match {JSON.stringify(match)}
            Location {JSON.stringify(location)}
            History {JSON.stringify(history)}
          </div>
        )
      })

      const apiGatewayEvent = {
        path: '/root-path/non-existing-page',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        queryStringParameters: {},
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      // TODO. Must be 404. https://github.com/reimagined/resolve/issues/1066
      //expect(result.statusCode).toEqual(404)
      expect(result.headers).toEqual({ 'Content-Type': 'text/html' })
      expect(result.body).toMatch('Error SSR page Match')
      expect(result.body).toMatch('Location')
      expect(result.body).toMatch('History')
    })

    test('should invoke existing read-model with existing resolver via GET /"rootPath"/api/query/"readModelName"/"resolverName"?"resolverArgs"', async () => {
      const readModel = {
        name: 'read-model-name',
        connectorName: 'default',
        projection: {},
        resolvers: {
          'resolver-name': jest.fn().mockImplementation(async (store, args) => {
            return args
          })
        }
      }

      const readModelConnector = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        drop: jest.fn(),
        dispose: jest.fn()
      }

      domain.readModels.push(readModel)
      assemblies.readModelConnectors['default'] = () => readModelConnector

      const apiGatewayEvent = {
        path: '/root-path/api/query/read-model-name/resolver-name',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        queryStringParameters: {
          key: 'value'
        },
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(200)
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' })
      expect(JSON.parse(result.body)).toEqual({
        key: 'value'
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
          })
        }
      }

      const readModelConnector = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        drop: jest.fn(),
        dispose: jest.fn()
      }

      domain.readModels.push(readModel)
      assemblies.readModelConnectors['default'] = () => readModelConnector

      const apiGatewayEvent = {
        path: '/root-path/api/query/read-model-name/non-existing-resolver-name',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        queryStringParameters: {
          key: 'value'
        },
        body: null
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
        queryStringParameters: { key: 'value' },
        body: null
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
        queryStringParameters: {},
        body: null
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

      domain.aggregates.push(aggregate)

      const apiGatewayEvent = {
        path: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8'
        },
        queryStringParameters: {},
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

      expect(result.statusCode).toEqual(200)
      expect(result.headers).toEqual({ 'Content-Type': 'text/plain' })
      expect(JSON.parse(result.body)).toEqual({
        aggregateId: 'aggregateId',
        aggregateVersion: 1,
        timestamp: 0,
        type: 'SET',
        payload: {
          key: 'key1',
          value: 'value1'
        }
      })

      expect(storageAdapter.saveEvent).toBeCalledWith({
        aggregateId: 'aggregateId',
        aggregateVersion: 1,
        timestamp: 0,
        type: 'SET',
        payload: {
          key: 'key1',
          value: 'value1'
        }
      })
    })

    test('should fail command via POST /"rootPath"/api/commands/ with ConcurrentError', async () => {
      storageAdapter.saveEvent = jest.fn().mockImplementation(async () => {
        throw new ConcurrentError()
      })

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

      domain.aggregates.push(aggregate)

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

      expect(result.statusCode).toEqual(408)
      expect(result.headers).toEqual({ 'Content-Type': 'text/plain' })
      expect(result.body).toEqual('Command error: Concurrency error')
    })

    test('should fail command via POST /"rootPath"/api/commands/ with CommandError', async () => {
      storageAdapter.saveEvent = jest.fn().mockImplementation(async () => {
        throw new ConcurrentError()
      })

      const aggregate = {
        name: 'BadAggregate',
        commands: {
          fail: () => {
            return {
              // BAD EVENT
            }
          }
        }
      }

      domain.aggregates.push(aggregate)

      const apiGatewayEvent = {
        path: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8'
        },
        queryStringParameters: {},
        body: JSON.stringify({
          aggregateName: 'BadAggregate',
          aggregateId: 'aggregateId',
          type: 'fail'
        })
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(400)
      expect(result.headers).toEqual({ 'Content-Type': 'text/plain' })
      expect(result.body).toEqual('Command error: Event "type" is required')
    })

    test('should fail command via POST /"rootPath"/api/commands/ with CustomerError', async () => {
      storageAdapter.saveEvent = jest.fn().mockImplementation(async () => {
        throw new ConcurrentError()
      })

      const aggregate = {
        name: 'BadAggregate',
        commands: {
          fail: () => {
            const error = new Error('I’m a teapot')
            error.code = 418
            throw error
          }
        }
      }

      domain.aggregates.push(aggregate)

      const apiGatewayEvent = {
        path: '/root-path/api/commands',
        httpMethod: 'POST',
        headers: {
          ...defaultRequestHttpHeaders,
          'Content-Type': 'application/json; charset=utf-8'
        },
        queryStringParameters: {},
        body: JSON.stringify({
          aggregateName: 'BadAggregate',
          aggregateId: 'aggregateId',
          type: 'fail'
        })
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(418)
      expect(result.headers).toEqual({ 'Content-Type': 'text/plain' })
      expect(result.body).toEqual('Command error: I’m a teapot')
    })

    test('should get subscribe options via GET /"rootPath"/api/subscribe/', async () => {
      STS.assumeRole.mockReturnValue({
        promise: jest.fn().mockReturnValue({
          Credentials: {
            AccessKeyId: 'AccessKeyId',
            SecretAccessKey: 'SecretAccessKey',
            SessionToken: 'SessionToken'
          }
        })
      })

      const apiGatewayEvent = {
        path: '/root-path/api/subscribe',
        httpMethod: 'GET',
        headers: { ...defaultRequestHttpHeaders },
        queryStringParameters: {
          origin: 'origin',
          adapterName: 'adapterName'
        },
        body: null
      }

      const cloudEntryWorker = await getCloudEntryWorker()

      const result = await cloudEntryWorker(apiGatewayEvent, lambdaContext)

      expect(result.statusCode).toEqual(200)
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' })
      expect(JSON.parse(result.body).appId).toEqual(
        process.env.RESOLVE_DEPLOYMENT_ID
      )
      expect(JSON.parse(result.body).url).toMatch(
        `wss://${process.env.RESOLVE_WS_ENDPOINT}/mqtt`
      )

      expect(STS.assumeRole).toBeCalledWith({
        RoleArn: process.env.RESOLVE_IOT_ROLE_ARN,
        RoleSessionName: `role-session-${process.env.RESOLVE_DEPLOYMENT_ID}`,
        DurationSeconds: 3600
      })
    })

    test('should get subscribe options via POST /"rootPath"/api/subscribe/', async () => {
      STS.assumeRole.mockReturnValue({
        promise: jest.fn().mockReturnValue({
          Credentials: {
            AccessKeyId: 'AccessKeyId',
            SecretAccessKey: 'SecretAccessKey',
            SessionToken: 'SessionToken'
          }
        })
      })

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

      expect(result.statusCode).toEqual(200)
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' })
      expect(JSON.parse(result.body).appId).toEqual(
        process.env.RESOLVE_DEPLOYMENT_ID
      )
      expect(JSON.parse(result.body).url).toMatch(
        `wss://${process.env.RESOLVE_WS_ENDPOINT}/mqtt`
      )

      expect(STS.assumeRole).toBeCalledWith({
        RoleArn: process.env.RESOLVE_IOT_ROLE_ARN,
        RoleSessionName: `role-session-${process.env.RESOLVE_DEPLOYMENT_ID}`,
        DurationSeconds: 3600
      })
    })

    test('should get subscribe options via POST /"rootPath"/api/my-api-handler-1/', async () => {
      domain.apiHandlers.push(
        {
          method: 'POST',
          path: 'my-api-handler-1',
          controller: async (req, res) => {
            res.setHeader('Content-type', 'application/octet-stream')
            res.end('Custom octet stream')
          }
        },
        {
          method: 'POST',
          path: 'my-api-handler-2',
          controller: async (req, res) => {
            res.setHeader('Content-type', 'text/plain')
            res.end('ok')
          }
        }
      )

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

      expect(result.statusCode).toEqual(200)
      expect(result.headers).toEqual({ 'Content-Type': 'text/plain' })
      expect(result.body).toEqual('ok')
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

      expect(result.statusCode).toEqual(302)
      expect(result.headers).toEqual({ Location: '/root-path/' })
      expect(result.body).toEqual('')
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

      expect(result.statusCode).toEqual(302)
      expect(result.headers).toEqual({
        Authorization: 'Bearer JWT',
        Location: '/root-path/'
      })
      expect(result.body).toEqual('')
    })
  })
})
