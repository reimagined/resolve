import handleDeployServiceEvent from '../src/cloud/cloud-service-event-handler'

describe('deploy-service-event-handler.test', () => {
  let resolve = null

  beforeEach(() => {
    resolve = {
      domain: { readModels: [] },
      eventSubscriber: {
        reset: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        status: jest.fn(),
        listProperties: jest.fn(),
        getProperty: jest.fn(),
        setProperty: jest.fn(),
        deleteProperty: jest.fn(),
      },
      executeQuery: jest.fn(),
      doUpdateRequest: jest.fn(),
    }
    resolve.executeQuery.drop = jest.fn()

    const addAnnotation = jest.fn()
    const addError = jest.fn()
    const close = jest.fn()
    const addNewSubsegment = jest.fn().mockReturnValue({
      addAnnotation,
      addError,
      close,
    })
    const getSegment = jest.fn().mockReturnValue({
      addNewSubsegment,
    })

    resolve.performanceTracer = {
      getSegment,
      addNewSubsegment,
      addAnnotation,
      addError,
      close,
    }
  })

  afterEach(() => {
    resolve = null
  })

  describe('properties', () => {
    test('listProperties should return list properties', async () => {
      resolve.eventSubscriber.listProperties.mockResolvedValueOnce({
        property: 'property',
      })

      const result = await handleDeployServiceEvent(
        {
          part: 'readModel',
          operation: 'listProperties',
          listenerId: 'readModelName',
        },
        resolve
      )

      expect(resolve.eventSubscriber.listProperties).toHaveBeenCalledWith({
        eventSubscriber: 'readModelName',
      })
      expect(result).toEqual({
        property: 'property',
      })
    })

    test('getProperty should return property', async () => {
      resolve.eventSubscriber.getProperty.mockResolvedValueOnce('value')

      const result = await handleDeployServiceEvent(
        {
          part: 'readModel',
          operation: 'getProperty',
          listenerId: 'readModelName',
          key: 'key',
        },
        resolve
      )

      expect(resolve.eventSubscriber.getProperty).toHaveBeenCalledWith({
        eventSubscriber: 'readModelName',
        key: 'key',
      })
      expect(result).toEqual('value')
    })

    test('setProperty should set property', async () => {
      resolve.eventSubscriber.setProperty.mockResolvedValueOnce('value')

      const result = await handleDeployServiceEvent(
        {
          part: 'readModel',
          operation: 'setProperty',
          listenerId: 'readModelName',
          key: 'key',
          value: 'value',
        },
        resolve
      )

      expect(resolve.eventSubscriber.setProperty).toHaveBeenCalledWith({
        eventSubscriber: 'readModelName',
        key: 'key',
        value: 'value',
      })
      expect(result).toEqual('ok')
    })

    test('deleteProperty should delete property', async () => {
      resolve.eventSubscriber.setProperty.mockResolvedValueOnce('value')

      const lambdaEvent = {
        part: 'readModel',
        operation: 'deleteProperty',
        listenerId: 'readModelName',
        key: 'key',
      }

      const result = await handleDeployServiceEvent(lambdaEvent, resolve)

      expect(resolve.eventSubscriber.deleteProperty).toHaveBeenCalledWith({
        eventSubscriber: 'readModelName',
        key: 'key',
      })
      expect(result).toEqual('ok')
    })
  })

  describe('read model', () => {
    test('handles specific read model reset correctly', async () => {
      resolve.eventSubscriber.reset.mockResolvedValueOnce({})

      const lambdaEvent = {
        part: 'readModel',
        operation: 'reset',
        listenerId: 'readModelName',
      }

      const result = await handleDeployServiceEvent(lambdaEvent, resolve)

      expect(resolve.eventSubscriber.reset).toHaveBeenCalledWith({
        eventSubscriber: 'readModelName',
      })
      expect(result).toEqual('ok')
    })

    test('handles getting of list', async () => {
      resolve.eventSubscriber.status.mockResolvedValueOnce({
        lastEvent: { type: 'TEST1' },
        lastError: null,
      })
      resolve.eventSubscriber.status.mockResolvedValueOnce({
        lastEvent: { type: 'TEST2' },
        lastError: null,
      })
      resolve.domain.readModels.push(
        { name: 'readModelName1' },
        { name: 'readModelName2' }
      )

      const lambdaEvent = {
        part: 'readModel',
        operation: 'list',
      }

      const result = await handleDeployServiceEvent(lambdaEvent, resolve)

      expect(resolve.eventSubscriber.status).toHaveBeenCalledWith({
        eventSubscriber: 'readModelName1',
      })
      expect(resolve.eventSubscriber.status).toHaveBeenCalledWith({
        eventSubscriber: 'readModelName2',
      })
      expect(result).toEqual([
        {
          name: 'readModelName1',
          lastEvent: { type: 'TEST1' },
          lastError: null,
        },
        {
          name: 'readModelName2',
          lastEvent: { type: 'TEST2' },
          lastError: null,
        },
      ])
    })

    test('handles specific read model getting of list', async () => {
      resolve.eventSubscriber.status.mockResolvedValueOnce({
        lastEvent: { type: 'TEST1' },
        lastError: null,
      })

      const lambdaEvent = {
        part: 'readModel',
        operation: 'list',
        listenerId: 'readModelName1',
      }

      const result = await handleDeployServiceEvent(lambdaEvent, resolve)

      expect(resolve.eventSubscriber.status).toHaveBeenCalledWith({
        eventSubscriber: 'readModelName1',
      })

      expect(result).toEqual([
        {
          name: 'readModelName1',
          lastEvent: { type: 'TEST1' },
          lastError: null,
        },
      ])
    })
  })

  describe('common', () => {
    test('throw error for unknown operation', async () => {
      const lambdaEvent = {
        part: 'readModel',
        operation: 'someUnknownOperation',
      }

      try {
        await handleDeployServiceEvent(lambdaEvent, resolve)
        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('throw error for unknown part', async () => {
      const lambdaEvent = {
        part: 'someUnknownPart',
      }

      try {
        await handleDeployServiceEvent(lambdaEvent, resolve)
        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })
  })
})
