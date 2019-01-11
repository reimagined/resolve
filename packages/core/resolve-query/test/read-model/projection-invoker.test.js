import projectionInvoker from '../../src/read-model/projection-invoker'

test('Read-model projection invoker should throw on disposed state', async () => {
  try {
    await projectionInvoker({ disposePromise: Promise.resolve() })
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual('Read model is disposed')
  }
})

test('Read-model projection invoker should re-throw last error', async () => {
  const lastError = new Error('Last error')
  try {
    await projectionInvoker({ lastError })
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toEqual(lastError)
  }
})
