import connectConsumer from '../src/consumer-client'
import { createClient } from 'resolve-local-rpc'

jest.mock('resolve-local-rpc', () => ({
  createClient: jest.fn(),
}))

test('should connect consumer', async () => {
  await connectConsumer({
    address: 'address',
  })

  expect(createClient).toHaveBeenCalledWith({
    address: 'address',
  })
})
