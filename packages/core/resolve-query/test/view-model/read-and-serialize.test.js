import sinon from 'sinon'

import readAndSerialize from '../../src/view-model/read-and-serialize'

test('View-model read and serialize should read and serialize', async () => {
  const aggregateIds = ['a', 'b', 'c', 'd']
  const jwtToken = { user: true }
  const repository = {
    read: sinon.stub().callsFake(async () => 'READ_RESULT'),
    serializeState: sinon.stub().callsFake(() => 'SERIALIZED_RESULT')
  }

  const result = await readAndSerialize(repository, { aggregateIds, jwtToken })

  expect(repository.read.callCount).toEqual(1)
  expect(repository.read.firstCall.args[0]).toEqual(repository)
  expect(repository.read.firstCall.args[1]).toEqual({ aggregateIds })

  expect(repository.serializeState.callCount).toEqual(1)
  expect(repository.serializeState.firstCall.args[0]).toEqual('READ_RESULT')
  expect(repository.serializeState.firstCall.args[1]).toEqual(jwtToken)

  expect(result).toEqual('SERIALIZED_RESULT')

  let hasError = false
  try {
    await readAndSerialize(repository)
  } catch (error) {
    hasError = true
  }

  expect(hasError).toEqual(false)
})
