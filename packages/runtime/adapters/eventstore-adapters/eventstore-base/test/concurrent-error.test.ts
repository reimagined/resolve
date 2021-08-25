import { ConcurrentError } from '../src'

describe('with Error.captureStackTrace', () => {
  test('ConcurrentError should contain name, message and stack', async () => {
    const aggregateId = 'aggregateId'

    const error = new ConcurrentError(aggregateId)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ConcurrentError)
    expect(error).toHaveProperty('name')
    expect(error).toHaveProperty('message')
    expect(error).toHaveProperty('stack')
  })
})
