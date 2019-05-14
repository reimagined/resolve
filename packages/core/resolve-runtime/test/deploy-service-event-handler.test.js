import handleDeployServiceEvent from '../src/common/handlers/deploy-service-event-handler'

const resolve = {
  sagaNames: new Map(),
  readModels: [{ name: 'readModel' }],
  eventBroker: {
    reset: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    status: jest.fn(),
    listProperties: jest.fn(),
    getProperty: jest.fn(),
    setProperty: jest.fn(),
    deleteProperty: jest.fn()
  },
  executeQuery: {
    drop: jest.fn()
  }
}

const clearMocks = () => {
  resolve.eventBroker.reset.mockClear()
  resolve.eventBroker.pause.mockClear()
  resolve.eventBroker.resume.mockClear()
  resolve.eventBroker.status.mockClear()
  resolve.eventBroker.listProperties.mockClear()
  resolve.eventBroker.getProperty.mockClear()
  resolve.eventBroker.setProperty.mockClear()
  resolve.eventBroker.deleteProperty.mockClear()
  resolve.executeQuery.drop.mockClear()
}

describe('properties', () => {
  afterEach(() => {
    clearMocks()
  })

  test('listProperties should return list properties', async () => {
    resolve.eventBroker.listProperties.mockResolvedValueOnce({
      property: 'property'
    })

    const result = await handleDeployServiceEvent(
      {
        part: 'readModel',
        operation: 'listProperties',
        listenerId: 'readModelName'
      },
      resolve
    )

    expect(resolve.eventBroker.listProperties).toHaveBeenCalledWith(
      'readModelName'
    )
    expect(result).toEqual({
      property: 'property'
    })
  })

  test('getProperty should return property', async () => {
    resolve.eventBroker.getProperty.mockResolvedValueOnce('value')

    const result = await handleDeployServiceEvent(
      {
        part: 'readModel',
        operation: 'getProperty',
        listenerId: 'readModelName',
        key: 'key'
      },
      resolve
    )

    expect(resolve.eventBroker.getProperty).toHaveBeenCalledWith(
      'readModelName',
      'key'
    )
    expect(result).toEqual('value')
  })

  test('setProperty should set property', async () => {
    resolve.eventBroker.setProperty.mockResolvedValueOnce('value')

    const result = await handleDeployServiceEvent(
      {
        part: 'readModel',
        operation: 'setProperty',
        listenerId: 'readModelName',
        key: 'key',
        value: 'value'
      },
      resolve
    )

    expect(resolve.eventBroker.setProperty).toHaveBeenCalledWith(
      'readModelName',
      'key',
      'value'
    )
    expect(result).toEqual('ok')
  })

  test('deleteProperty should delete property', async () => {
    resolve.eventBroker.setProperty.mockResolvedValueOnce('value')

    const lambdaEvent = {
      part: 'readModel',
      operation: 'deleteProperty',
      listenerId: 'readModelName',
      key: 'key'
    }

    const result = await handleDeployServiceEvent(lambdaEvent, resolve)

    expect(resolve.eventBroker.deleteProperty).toHaveBeenCalledWith(
      'readModelName',
      'key'
    )
    expect(result).toEqual('ok')
  })
})

describe('read model', () => {
  afterEach(() => {
    clearMocks()
  })

  test('handles specific read model reset correctly', async () => {
    resolve.eventBroker.reset.mockResolvedValueOnce({})

    const lambdaEvent = {
      part: 'readModel',
      operation: 'reset',
      listenerId: 'readModelName'
    }

    const result = await handleDeployServiceEvent(lambdaEvent, resolve)

    expect(resolve.eventBroker.reset).toHaveBeenCalledWith(
      'readModelName'
    )
    expect(resolve.executeQuery.drop).toHaveBeenCalledWith(
      'readModelName'
    )
    expect(result).toEqual('ok')
  })

  test('handles getting of list', async () => {
    resolve.eventBroker.status.mockResolvedValueOnce({
      lastEvent: { type: 'TEST1' },
      lastError: null
    })
    resolve.eventBroker.status.mockResolvedValueOnce({
      lastEvent: { type: 'TEST2' },
      lastError: null
    })

    const lambdaEvent = {
      part: 'readModel',
      operation: 'list'
    }

    const result = await handleDeployServiceEvent(lambdaEvent, resolve)

    expect(resolve.eventBroker.reset).toHaveBeenCalledWith(
      'readModelName'
    )
    expect(result).toEqual([{
      name: 'readModelName1',
      lastEvent: { type: 'TEST1' },
      lastError: null
    }, {
      name: 'readModelName2',
      lastEvent: { type: 'TEST2' },
      lastError: null
    }])
  })
  //
  // test('handles specific read model getting of list', async () => {
  //   resolve.eventBroker.status.mockResolvedValueOnce({
  //     lastEvent: { type: 'TEST1' },
  //     lastError: null
  //   })
  //
  //   const lambdaEvent = {
  //     part: 'readModel',
  //     operation: 'list',
  //     listenerId: 'readModelName1'
  //   }
  //
  //   const result = await handleDeployServiceEvent(lambdaEvent, resolve)
  //
  //   expect(result).toEqual([{
  //     name: 'readModelName1',
  //     lastEvent: { type: 'TEST1' },
  //     lastError: null
  //   }])
  //})
})
//
// describe('common', () => {
//   test('throw error for unknown operation', async () => {
//     const lambdaEvent = {
//       part: 'readModel',
//       operation: 'someUnknownOperation'
//     }
//
//     try {
//       await handleDeployServiceEvent(lambdaEvent, resolve)
//       return Promise.reject('Test failed')
//     } catch (error) {
//       expect(error).toBeInstanceOf(Error)
//     }
//
//     expect(resolve.executeQuery.drop).toHaveBeenCalledTimes(0)
//   })
//
//   test('throw error for unknown part', async () => {
//     const lambdaEvent = {
//       part: 'someUnknownPart'
//     }
//
//     try {
//       await handleDeployServiceEvent(lambdaEvent, resolve)
//       return Promise.reject('Test failed')
//     } catch (error) {
//       expect(error).toBeInstanceOf(Error)
//     }
//
//     expect(resolve.executeQuery.drop).toHaveBeenCalledTimes(0)
//   })
// })
//
