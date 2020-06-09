import ConcurrentError from '../src/concurrent-error'

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

describe('without Error.captureStackTrace', () => {
  let captureStackTrace = null

  beforeEach(() => {
    captureStackTrace = Error.captureStackTrace
    delete Error.captureStackTrace
  })

  afterEach(() => {
    Error.captureStackTrace = captureStackTrace
  })

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
