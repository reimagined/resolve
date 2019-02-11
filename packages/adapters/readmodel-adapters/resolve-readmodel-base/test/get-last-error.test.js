import getLastError from '../src/get-last-error'

test('Read-model get last error should throw on disposed state', async () => {
  try {
    await getLastError({ disposePromise: Promise.resolve() }, {})
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual('Read model is disposed')
  }
})

test('Read-model get last error should re-throw last error', async () => {
  const lastError = new Error()
  const readModel = { lastError }

  const result = await getLastError(readModel)

  expect(result).toEqual(lastError)
})

test('Read-model get last error should return null if not initialized', async () => {
  const readModel = {}

  const result = await getLastError(readModel)

  expect(result).toEqual(null)
})

test('Read-model get last error should re-throw error from init if exists', async () => {
  const initError = new Error()
  const readModel = { loadEventsPromise: Promise.reject(initError) }

  const result = await getLastError(readModel)

  expect(result).toEqual(initError)
})

test('Read-model get last error should return null if init success', async () => {
  const readModel = { loadEventsPromise: Promise.resolve() }

  const result = await getLastError(readModel)

  expect(result).toEqual(null)
})
