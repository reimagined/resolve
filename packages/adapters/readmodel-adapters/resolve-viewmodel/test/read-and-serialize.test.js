import sinon from 'sinon'

import readAndSerialize from '../src/read-and-serialize'

test('View-model read and serialize should read and serialize', async () => {
  const aggregateIds = ['a', 'b', 'c', 'd']
  const jwtToken = { user: true }
  const pool = {
    read: sinon.stub().callsFake(async () => 'READ_RESULT'),
    serializeState: sinon.stub().callsFake(() => 'SERIALIZED_RESULT')
  }

  const result = await readAndSerialize(pool, { aggregateIds, jwtToken })

  expect(pool.read.callCount).toEqual(1)
  expect(pool.read.firstCall.args[0]).toEqual(pool)
  expect(pool.read.firstCall.args[1]).toEqual({ aggregateIds })

  expect(pool.serializeState.callCount).toEqual(1)
  expect(pool.serializeState.firstCall.args[0]).toEqual('READ_RESULT')
  expect(pool.serializeState.firstCall.args[1]).toEqual(jwtToken)

  expect(result).toEqual('SERIALIZED_RESULT')

  let hasError = false
  try {
    await readAndSerialize(pool)
  } catch (error) {
    hasError = true
  }

  expect(hasError).toEqual(false)
})
