import handleResolveEvent from '../src/handlers/resolve_event_handler'

describe('resolve event handler', () => {
  const executor = {
    read: jest.fn(),
    dispose: jest.fn()
  }

  const resolve = {
    readModels: [
      { name: 'readModel1' },
      { name: 'readModel2' }
    ],
    executeQuery: {
      getExecutor: jest.fn(),
      getExecutors: jest.fn()
    }
  }

  afterEach(() => {
    executor.dispose.mockClear()
    resolve.executeQuery.getExecutors.mockClear()
    resolve.executeQuery.getExecutor.mockClear()
  })

  describe('common', () => {
    it('returns null for unknown operation', async () => {
      const lambdaEvent = {
        part: 'readModel',
        operation: 'someUnknownOperation'
      }

      const result = await handleResolveEvent(lambdaEvent, resolve)
      expect(result).toEqual(null)

      expect(resolve.executeQuery.getExecutors).toHaveBeenCalledTimes(0)
      expect(resolve.executeQuery.getExecutor).toHaveBeenCalledTimes(0)
    })

    it('returns null for unknown part', async () => {
      const lambdaEvent = {
        part: 'someUnknownPart'
      }

      const result = await handleResolveEvent(lambdaEvent, resolve)
      expect(result).toEqual(null)

      expect(resolve.executeQuery.getExecutors).toHaveBeenCalledTimes(0)
      expect(resolve.executeQuery.getExecutor).toHaveBeenCalledTimes(0)
    })
  })

  describe('read model', () => {
    it('handles read model reset correctly', async () => {
      const lambdaEvent = {
        part: 'readModel',
        operation: 'reset'
      }

      resolve.executeQuery.getExecutors.mockReturnValueOnce([executor])

      const result = await handleResolveEvent(lambdaEvent, resolve)

      expect(result).toEqual('ok')

      expect(resolve.executeQuery.getExecutors).toHaveBeenCalledTimes(1)
      expect(resolve.executeQuery.getExecutor).toHaveBeenCalledTimes(0)

      expect(executor.read).toHaveBeenCalledWith({
        isBulkRead: true
      })

      expect(executor.dispose).toHaveBeenCalledTimes(1)
    })

    it('handles specific read model reset correctly', async () => {
      const lambdaEvent = {
        part: 'readModel',
        operation: 'reset',
        name: 'default'
      }

      resolve.executeQuery.getExecutor.mockReturnValueOnce(executor)

      const result = await handleResolveEvent(lambdaEvent, resolve)

      expect(result).toEqual('ok')

      expect(resolve.executeQuery.getExecutor).toHaveBeenCalledWith('default')
      expect(resolve.executeQuery.getExecutors).toHaveBeenCalledTimes(0)

      expect(executor.read).toHaveBeenCalledWith({
        isBulkRead: true
      })

      expect(executor.dispose).toHaveBeenCalledTimes(1)
    })

    it('handles getting of list', async () => {
      const lambdaEvent = {
        part: 'readModel',
        operation: 'list'
      }

      const result = await handleResolveEvent(lambdaEvent, resolve)

      expect(result).toEqual(['readModel1', 'readModel2'])
    })
  })
})
