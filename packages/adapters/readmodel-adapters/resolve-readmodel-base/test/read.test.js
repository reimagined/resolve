import read from '../src/read'

test('Read-model read should throw on disposed state', async () => {
  try {
    await read({ disposePromise: Promise.resolve() }, {})
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual('Read model is disposed')
  }
})

test('Read-model read should throw on non-existing resolver', async () => {
  const readModel = {
    resolvers: {},
    connect: () => {}
  }
  try {
    await read(readModel, { resolverName: 'NON_EXISTING_RESOLVER' })
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual(
      `The 'NON_EXISTING_RESOLVER' resolver is not specified or not function`
    )
  }
})
