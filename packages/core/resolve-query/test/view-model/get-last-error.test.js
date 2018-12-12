import getLastError from '../../src/view-model/get-last-error'

test('View-model get last error', async () => {
  const lastError = new Error('Last view model error')
  const worker = Promise.resolve({ lastError })

  const repository = {
    getKey: () => 'key',
    activeWorkers: new Map([['key', worker]])
  }
  const result = await getLastError(repository)

  expect(result).toEqual(lastError)
})
