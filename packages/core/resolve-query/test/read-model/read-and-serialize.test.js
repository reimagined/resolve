import sinon from 'sinon'

import readAndSerialize from '../../src/read-model/read-and-serialize'

test('Read-model read and serialize should invoke resolver and serialize result', async () => {
  const readResult = { content: 'content' }
  const repository = {
    read: sinon.stub().callsFake(async () => readResult)
  }
  const resolverName = 'RESOLVER_NAME'
  const resolverArgs = {}
  const jwtToken = 'JWT_TOKEN'

  const result = await readAndSerialize(repository, {
    resolverName,
    resolverArgs,
    jwtToken
  })

  expect(repository.read.callCount).toEqual(1)
  expect(repository.read.firstCall.args[0]).toEqual(repository)
  expect(repository.read.firstCall.args[1]).toEqual({
    resolverName,
    resolverArgs,
    jwtToken
  })

  const serializedReadResult = JSON.stringify(readResult, null, 2)

  expect(result).toEqual(serializedReadResult)
})
