import getLastError from '../src/get-last-error'

test('View-model get last error', async () => {
  const lastError = new Error('Last view model error')
  const worker = Promise.resolve({ lastError })

  const pool = {
    getKey: () => 'key',
    activeWorkers: new Map([['key', worker]])
  }
  const result = await getLastError(pool)

  expect(result).toEqual(lastError)
})
