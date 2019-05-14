import handleDeployServiceEvent from '../src/common/handlers/deploy-service-event-handler'

const resolve = {
  readModels: [{ name: 'readModel' }],
  eventBroker: {
    listProperties: jest.fn(),
    getProperty: jest.fn(),
    setProperty: jest.fn(),
    deleteProperty: jest.fn()
  }
}

const clearMocks = () => {
  resolve.eventBroker.listProperties.mockClear()
  resolve.eventBroker.getProperty.mockClear()
  resolve.eventBroker.setProperty.mockClear()
  resolve.eventBroker.deleteProperty.mockClear()
}

afterEach(() => {
  clearMocks()
})

describe('properties', () => {
  test('listProperties should return list properties', async () => {
    resolve.eventBroker.listProperties.mockReturnValueOnce({ property: 'property' })

    const result = await handleDeployServiceEvent({
      part: 'readModel',
      operation: 'listProperties',
      listenerId: 'readModelName'
    }, resolve)

    expect(resolve.eventBroker.listProperties).toHaveBeenCalledWith('readModelName')
    expect(result).toEqual({
      property: 'property'
    })
  })


  test('getProperty should return property', async () => {
    resolve.eventBroker.getProperty.mockReturnValueOnce('value')

    const result = await handleDeployServiceEvent({
      part: 'readModel',
      operation: 'getProperty',
      listenerId: 'readModelName',
      key: 'key'
    }, resolve)

    expect(resolve.eventBroker.getProperty).toHaveBeenCalledWith('readModelName', 'key')
    expect(result).toEqual('value')
  })

  test('setProperty should set property', async () => {
    resolve.eventBroker.setProperty.mockReturnValueOnce('value')

    const result = await handleDeployServiceEvent({
      part: 'readModel',
      operation: 'setProperty',
      listenerId: 'readModelName',
      key: 'key',
      value: 'value'
    }, resolve)

    expect(resolve.eventBroker.setProperty).toHaveBeenCalledWith('readModelName', 'key', 'value')
    expect(result).toEqual('ok')
  })

  test('deleteProperty should delete property', async () => {
    resolve.eventBroker.setProperty.mockReturnValueOnce('value')

    const lambdaEvent = {
      part: 'readModel',
      operation: 'deleteProperty',
      listenerId: 'readModelName',
      key: 'key'
    }

    const result = await handleDeployServiceEvent(lambdaEvent, resolve)

    expect(resolve.eventBroker.deleteProperty).toHaveBeenCalledWith('readModelName', 'key')
    expect(result).toEqual('ok')
  })
})
