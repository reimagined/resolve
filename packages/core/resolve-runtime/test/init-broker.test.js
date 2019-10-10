import initBroker from '../src/cloud/init-broker'

describe('event-broker', () => {
  let broker, lambda, lambdaResult

  const readModels = [
    {
      name: 'listenerId',
      connectorName: 'default',
      projection: {},
      resolvers: {}
    }
  ]

  const eventListeners = new Map([
    [
      'listenerId',
      {
        name: 'listenerId',
        eventTypes: [],
        invariantHash: 'invariantHash'
      }
    ]
  ])

  beforeEach(async () => {
    lambdaResult = null
    lambda = {
      invoke: jest.fn().mockReturnValue({
        promise: jest.fn().mockImplementation(async () => lambdaResult)
      })
    }

    broker = {}
    await initBroker({
      eventListeners,
      eventBroker: broker,
      lambda,
      readModels
    })
  })

  afterEach(() => {
    lambdaResult = null
    broker = null
    lambda = null
  })

  test('"pause" should pause listener by listenerId', async () => {
    lambdaResult = {
      Payload: JSON.stringify('ok')
    }

    const result = await broker.pause('listenerId')

    expect(JSON.parse(lambda.invoke.mock.calls[0][0].Payload)).toEqual({
      listenerId: 'listenerId',
      operation: 'pause'
    })

    expect(result).toEqual('ok')
  })

  test('"resume" should resume listener by listenerId', async () => {
    lambdaResult = {
      Payload: JSON.stringify('ok')
    }

    const result = await broker.resume('listenerId')

    expect(JSON.parse(lambda.invoke.mock.calls[0][0].Payload)).toEqual({
      listenerId: 'listenerId',
      operation: 'resume'
    })

    expect(JSON.parse(lambda.invoke.mock.calls[1][0].Payload)).toEqual({
      listenerId: 'listenerId',
      inactiveTimeout: 3600000,
      invariantHash: 'invariantHash',
      eventTypes: []
    })

    expect(result).toEqual('ok')
  })

  test('"status" should return status by listenerId', async () => {
    lambdaResult = {
      Payload: JSON.stringify({
        lastEvent: null,
        lastError: null,
        status: 'running'
      })
    }

    const result = await broker.status('listenerId')

    expect(JSON.parse(lambda.invoke.mock.calls[0][0].Payload)).toEqual({
      listenerId: 'listenerId',
      operation: 'status'
    })

    expect(result).toEqual({
      lastEvent: null,
      lastError: null,
      status: 'running'
    })
  })

  test('"reset" should reset listener by listenerId', async () => {
    lambdaResult = {
      Payload: JSON.stringify('ok')
    }

    const result = await broker.reset('listenerId')

    expect(JSON.parse(lambda.invoke.mock.calls[0][0].Payload)).toEqual({
      listenerId: 'listenerId',
      operation: 'reset'
    })

    expect(result).toEqual('ok')
  })

  test('"listProperties" should return list properties by listenerId', async () => {
    lambdaResult = {
      Payload: JSON.stringify({
        key1: 'value1',
        key2: 'value2'
      })
    }

    const result = await broker.listProperties('listenerId')

    expect(JSON.parse(lambda.invoke.mock.calls[0][0].Payload)).toEqual({
      listenerId: 'listenerId',
      operation: 'listProperties'
    })

    expect(result).toEqual({
      key1: 'value1',
      key2: 'value2'
    })
  })

  test('"getProperty" should return property by listenerId, key', async () => {
    lambdaResult = {
      Payload: JSON.stringify('value1')
    }

    const result = await broker.getProperty('listenerId', 'key1')

    expect(JSON.parse(lambda.invoke.mock.calls[0][0].Payload)).toEqual({
      listenerId: 'listenerId',
      operation: 'getProperty',
      key: 'key1'
    })

    expect(result).toEqual('value1')
  })

  test('"setProperty" should set property value by listenerId, key', async () => {
    lambdaResult = {
      Payload: JSON.stringify('ok')
    }

    const result = await broker.setProperty('listenerId', 'key1', 'value1')

    expect(JSON.parse(lambda.invoke.mock.calls[0][0].Payload)).toEqual({
      listenerId: 'listenerId',
      operation: 'setProperty',
      key: 'key1',
      value: 'value1'
    })

    expect(result).toEqual('ok')
  })

  test('"deleteProperty" should delete property by listenerId, key', async () => {
    lambdaResult = {
      Payload: JSON.stringify('ok')
    }

    const result = await broker.deleteProperty('listenerId', 'key1')

    expect(JSON.parse(lambda.invoke.mock.calls[0][0].Payload)).toEqual({
      listenerId: 'listenerId',
      operation: 'deleteProperty',
      key: 'key1'
    })

    expect(result).toEqual('ok')
  })
})
