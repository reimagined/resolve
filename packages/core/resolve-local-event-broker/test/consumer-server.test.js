import createAndInitConsumer from '../src/consumer-server'
import { createServer } from 'resolve-local-rpc'

jest.mock('resolve-local-rpc', () => ({
  createServer: jest.fn()
}))

test('should create and init consumer', async () => {
  await createAndInitConsumer({
    address: 'address'
  })

  expect(createServer).toHaveBeenCalledWith({
    address: 'address',
    hostObject: {
      beginXATransaction: expect.any(Function),
      commitXATransaction: expect.any(Function),
      rollbackXATransaction: expect.any(Function),
      sendEvents: expect.any(Function)
    }
  })
})
