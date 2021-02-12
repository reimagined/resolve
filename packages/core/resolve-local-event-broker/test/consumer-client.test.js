import connectConsumer from '../src/consumer-client'
import { createClient } from '@reimagined/local-rpc'

jest.mock('@reimagined/local-rpc', () => ({
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
