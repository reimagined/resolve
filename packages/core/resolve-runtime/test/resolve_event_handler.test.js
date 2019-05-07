import handleDeployServiceEvent from '../src/common/handlers/deploy-service-event-handler'
import initBroker from '../src/cloud/init-broker'

describe('resolve event handler', () => {
  let resolve = null

  beforeEach(() => {
    resolve = {
      readModels: [{ name: 'readModel1' }, { name: 'readModel2' }],
      executeQuery: { drop: jest.fn() },
      lambda: {
        invoke: jest.fn().mockReturnValue({
          promise: jest.fn().mockReturnValue(
            Promise.resolve({
              Payload: JSON.stringify({})
            })
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

  describe('common', () => {
    it('returns null for unknown operation', async () => {
      const lambdaEvent = {
        part: 'readModel',
        operation: 'someUnknownOperation'
      }

      const result = await handleDeployServiceEvent(lambdaEvent, resolve)
      expect(result).toEqual(null)

      expect(resolve.executeQuery.drop).toHaveBeenCalledTimes(0)
    })

    it('returns null for unknown part', async () => {
      const lambdaEvent = {
        part: 'someUnknownPart'
      }

      const result = await handleDeployServiceEvent(lambdaEvent, resolve)
      expect(result).toEqual(null)

      expect(resolve.executeQuery.drop).toHaveBeenCalledTimes(0)
    })
  })

  describe('read model', () => {
    it('handles read model reset correctly', async () => {
      const lambdaEvent = {
        part: 'readModel',
        operation: 'reset'
      }

      const result = await handleDeployServiceEvent(lambdaEvent, resolve)

      expect(result).toEqual('ok')

      expect(resolve.executeQuery.drop).toHaveBeenCalledTimes(2)
    })

    it('handles specific read model reset correctly', async () => {
      const lambdaEvent = {
        part: 'readModel',
        operation: 'reset',
        name: 'default'
      }

      const result = await handleDeployServiceEvent(lambdaEvent, resolve)

      expect(result).toEqual('ok')

      expect(resolve.executeQuery.drop).toHaveBeenCalledTimes(1)
    })

    it('handles getting of list', async () => {
      const lambdaEvent = {
        part: 'readModel',
        operation: 'list'
      }

      const result = await handleDeployServiceEvent(lambdaEvent, resolve)

      expect(result).toEqual([{ name: 'readModel1' }, { name: 'readModel2' }])
    })
  })
})
