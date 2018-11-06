import sinon from 'sinon'

import read from '../../src/read-model/read'

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
  const repository = { resolvers: {} }
  try {
    await read(repository, { resolverName: 'NON_EXISTING_RESOLVER' })
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual(
      `The 'NON_EXISTING_RESOLVER' resolver is not specified or not function`
    )
  }
})

test('Read-model read should retrieve store and invoke resolver', async () => {
  const store = {}
  const repository = {
    getModelReadInterface: sinon.stub().callsFake(async () => store),
    resolvers: {
      RESOLVER_NAME: sinon.stub().callsFake(async () => null)
    }
  }
  const resolverArgs = {}
  const jwtToken = 'JWT_TOKEN'

  await read(repository, {
    resolverName: 'RESOLVER_NAME',
    resolverArgs,
    jwtToken
  })

  expect(repository.getModelReadInterface.callCount).toEqual(2)

  expect(repository.resolvers.RESOLVER_NAME.callCount).toEqual(1)
  expect(repository.resolvers.RESOLVER_NAME.firstCall.args[0]).toEqual(store)
  expect(repository.resolvers.RESOLVER_NAME.firstCall.args[1]).toEqual(
    resolverArgs
  )
  expect(repository.resolvers.RESOLVER_NAME.firstCall.args[2]).toEqual(jwtToken)
})
