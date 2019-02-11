import read from '../src/read'

test('View-model read should fail on wrong aggregates ids', async () => {
  try {
    await read(null)
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual(
      'View models are build up only with aggregateIds array or wildcard argument'
    )
  }
})

test('View-model read should read view model', async () => {
  const state = { content: 'content' }
  const worker = Promise.resolve({ state })
  const pool = {
    activeWorkers: new Map([['key', worker]]),
    getKey: () => 'key'
  }
  const aggregateIds = ['a', 'b', 'c', 'd']

  const result = await read(pool, { aggregateIds })

  expect(result).toEqual(state)
})
