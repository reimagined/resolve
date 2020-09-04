import Lambda, { setLambdaResult, result } from 'aws-sdk/clients/lambda'
import initBroker from '../src/cloud/init-broker'

describe('event-publisher', () => {
  let publisher, lambdaInvoke
  const readModels = [
    {
      name: 'listenerId',
      connectorName: 'default',
      projection: {},
      resolvers: {},
    },
  ]
  const eventListeners = new Map([
    [
      'listenerId',
      {
        name: 'listenerId',
        eventTypes: [],
        invariantHash: 'invariantHash',
      },
    ],
  ])

  beforeEach(async () => {
    lambdaInvoke = Lambda.prototype.invoke
    publisher = {}
    await initBroker({
      eventListeners,
      publisher,
      readModels,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    setLambdaResult(null)
    result.length = 0
    publisher = null
    lambdaInvoke = null
  })

  test('"pause" should pause listener by listenerId', async () => {
    setLambdaResult('ok')

    const result = await publisher.pause({ eventSubscriber: 'listenerId' })

    expect(JSON.parse(lambdaInvoke.mock.calls[0][0].Payload)).toEqual({
      payload: {
        principial: {},
        eventSubscriber: 'listenerId',
        validationRoleArn: 'RoleValidationArn',
      },
      type: 'pause',
    })

    expect(result).toEqual('ok')
  })

  test('"resume" should resume listener by listenerId', async () => {
    setLambdaResult('ok')

    const result = await publisher.resume({ eventSubscriber: 'listenerId' })

    expect(JSON.parse(lambdaInvoke.mock.calls[0][0].Payload)).toEqual({
      payload: {
        principial: {},
        eventSubscriber: 'listenerId',
        validationRoleArn: 'RoleValidationArn',
      },
      type: 'resume',
    })

    expect(result).toEqual('ok')
  })

  test('"status" should return status by listenerId', async () => {
    setLambdaResult({
      lastEvent: null,
      lastError: null,
      status: 'running',
    })

    const result = await publisher.status({ eventSubscriber: 'listenerId' })

    expect(JSON.parse(lambdaInvoke.mock.calls[0][0].Payload)).toEqual({
      payload: {
        principial: {},
        eventSubscriber: 'listenerId',
        validationRoleArn: 'RoleValidationArn',
      },
      type: 'status',
    })

    expect(result).toEqual({
      lastEvent: null,
      lastError: null,
      status: 'running',
    })
  })

  test('"reset" should reset listener by listenerId', async () => {
    setLambdaResult('ok')

    const result = await publisher.reset({ eventSubscriber: 'listenerId' })

    expect(JSON.parse(lambdaInvoke.mock.calls[0][0].Payload)).toEqual({
      payload: {
        principial: {},
        eventSubscriber: 'listenerId',
        validationRoleArn: 'RoleValidationArn',
      },
      type: 'reset',
    })

    expect(result).toEqual('ok')
  })

  test('"listProperties" should return list properties by listenerId', async () => {
    setLambdaResult({
      key1: 'value1',
      key2: 'value2',
    })

    const result = await publisher.listProperties({
      eventSubscriber: 'listenerId',
    })

    expect(JSON.parse(lambdaInvoke.mock.calls[0][0].Payload)).toEqual({
      payload: {
        principial: {},
        eventSubscriber: 'listenerId',
        validationRoleArn: 'RoleValidationArn',
      },
      type: 'listProperties',
    })

    expect(result).toEqual({
      key1: 'value1',
      key2: 'value2',
    })
  })

  test('"getProperty" should return property by listenerId, key', async () => {
    setLambdaResult('value1')

    const result = await publisher.getProperty({
      eventSubscriber: 'listenerId',
      key: 'key1',
    })

    expect(JSON.parse(lambdaInvoke.mock.calls[0][0].Payload)).toEqual({
      payload: {
        principial: {},
        eventSubscriber: 'listenerId',
        validationRoleArn: 'RoleValidationArn',
        key: 'key1',
      },
      type: 'getProperty',
    })

    expect(result).toEqual('value1')
  })

  test('"setProperty" should set property value by listenerId, key', async () => {
    setLambdaResult('ok')

    const result = await publisher.setProperty({
      eventSubscriber: 'listenerId',
      key: 'key1',
      value: 'value1',
    })

    expect(JSON.parse(lambdaInvoke.mock.calls[0][0].Payload)).toEqual({
      payload: {
        principial: {},
        eventSubscriber: 'listenerId',
        validationRoleArn: 'RoleValidationArn',
        key: 'key1',
        value: 'value1',
      },
      type: 'setProperty',
    })

    expect(result).toEqual('ok')
  })

  test('"deleteProperty" should delete property by listenerId, key', async () => {
    setLambdaResult('ok')

    const result = await publisher.deleteProperty({
      eventSubscriber: 'listenerId',
      key: 'key1',
    })

    expect(JSON.parse(lambdaInvoke.mock.calls[0][0].Payload)).toEqual({
      payload: {
        principial: {},
        eventSubscriber: 'listenerId',
        validationRoleArn: 'RoleValidationArn',
        key: 'key1',
      },
      type: 'deleteProperty',
    })

    expect(result).toEqual('ok')
  })
})
