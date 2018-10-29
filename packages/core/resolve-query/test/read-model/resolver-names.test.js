import sinon from 'sinon'

import resolverNames from '../../src/read-model/resolver-names'

test('Read-model read should throw on disposed state', async () => {
  try {
    await resolverNames({ disposePromise: Promise.resolve() }, {})
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual('Read model is disposed')
  }
})

test('Read-model read should return projection functions names', async () => {
  const repository = {
    resolvers: {
      RESOLVER_ONE: sinon.stub().callsFake(async () => null),
      RESOLVER_TWO: sinon.stub().callsFake(async () => null)
    }
  }

  const names = resolverNames(repository)
  expect(names).toEqual(['RESOLVER_ONE', 'RESOLVER_TWO'])
})
