import initBroker from '../src/cloud/init-broker'
import handleDeployServiceEvent from '../src/common/handlers/deploy-service-event-handler'

describe('properties', () => {
  let resolve = null
  let lambdaResponse = null

  beforeEach(() => {
    lambdaResponse = JSON.stringify({})
    resolve = {
      readModels: [{ name: 'readModel' }],
      executeQuery: { drop: jest.fn() },
      lambda: {
        invoke: jest.fn().mockReturnValue({
          promise: jest.fn().mockReturnValue(
            Promise.resolve(
              Object.create(null, {
                Payload: {
                  get() {
                    return JSON.stringify(lambdaResponse)
                  }
                }
              })
            )
          )
        })
      },
      eventBroker: {}
    }

    initBroker(resolve)
  })

  afterEach(() => {
    resolve = null
  })

  test('listProperties should return list properties', async () => {
    lambdaResponse = {
      START_TIMESTAMP: 42
    }

    const lambdaEvent = {
      part: 'readModel',
      operation: 'listProperties',
      listenerId: 'readModel'
    }

    const result = await handleDeployServiceEvent(lambdaEvent, resolve)

    expect(result).toEqual({
      START_TIMESTAMP: 42
    })
  })

  test('getProperty should return property', async () => {
    lambdaResponse = 'value'

    const lambdaEvent = {
      part: 'readModel',
      operation: 'getProperty',
      listenerId: 'readModel',
      key: 'key'
    }

    const result = await handleDeployServiceEvent(lambdaEvent, resolve)

    expect(result).toEqual('value')
  })

  test('setProperty should set property', async () => {
    lambdaResponse = 'value'

    const lambdaEvent = {
      part: 'readModel',
      operation: 'setProperty',
      listenerId: 'readModel',
      key: 'key',
      value: 'value'
    }

    const result = await handleDeployServiceEvent(lambdaEvent, resolve)

    expect(result).toEqual('ok')
  })

  test('deleteProperty should delete property', async () => {
    lambdaResponse = 'value'

    const lambdaEvent = {
      part: 'readModel',
      operation: 'deleteProperty',
      listenerId: 'readModel',
      key: 'key'
    }

    const result = await handleDeployServiceEvent(lambdaEvent, resolve)

    expect(result).toEqual('ok')
  })
})
