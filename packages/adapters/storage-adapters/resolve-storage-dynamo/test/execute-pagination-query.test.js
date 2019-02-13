import sinon from 'sinon'

import executePaginationQuery from '../src/execute-pagination-query'

describe('method "executePaginationQuery"', () => {
  test('should return events', async () => {
    const documentClient = {}
    const query = {}
    const executeSingleQuery = sinon.stub()
    const decodeEmptyStrings = sinon.stub().callsFake(event => event)
    const callback = sinon.stub().returns(Promise.resolve())

    executeSingleQuery.onCall(0).returns(
      Promise.resolve({
        Items: [{ type: 'type1' }, { type: 'type2' }],
        LastEvaluatedKey: 'id2'
      })
    )
    executeSingleQuery.returns(
      Promise.resolve({
        Items: [{ type: 'type3' }]
      })
    )

    await executePaginationQuery(
      { documentClient, executeSingleQuery, decodeEmptyStrings },
      query,
      callback
    )

    sinon.assert.calledWith(callback, { type: 'type1' })
    sinon.assert.calledWith(callback, { type: 'type2' })
    sinon.assert.calledWith(callback, { type: 'type3' })
    sinon.assert.callCount(callback, 3)
  })

  test('should return error', async () => {
    const documentClient = {}
    const query = {}
    const executeSingleQuery = sinon.stub()
    const decodeEmptyStrings = sinon.stub().callsFake(event => event)
    const callback = sinon.stub()
    const error = 'error'

    executeSingleQuery.returns(Promise.reject(error))

    try {
      await executePaginationQuery(
        { documentClient, executeSingleQuery, decodeEmptyStrings },
        query,
        callback
      )
      throw new Error('failure')
    } catch (err) {
      expect(err).toEqual(err)
    }

    sinon.assert.callCount(callback, 0)
  })
})
