import connectPublisher from '../src/publisher-client'
import { createClient } from '@reimagined/local-rpc'

jest.mock('@reimagined/local-rpc', () => ({
  createClient: jest.fn(),
}))

test('should connect publisher', async () => {
  await connectPublisher({
    address: 'address',
  })

  expect(createClient).toHaveBeenCalledWith({
    address: 'address',
    preExecHooks: {
      status: expect.any(Function),
      resume: expect.any(Function),
      pause: expect.any(Function),
    },
  })
})
