import sinon from 'sinon'

import executeSingleQuery from '../src/execute-single-query'
import { temporaryErrors } from '../src/constants'

describe('method "executeSingleQuery"', () => {
  test('should return events', async () => {
    const events = [{ type: 'type1' }, { type: 'type2' }]
    const query = {}
    const documentClient = {
      query: sinon.stub().returns({
        promise: sinon.stub().returns(Promise.resolve(events))
      })
    }

    const result = await executeSingleQuery(documentClient, query)

    expect(result).toEqual(events)
  })

  test('should throw temporary error and error', async () => {
    const temporaryError = new Error('temporaryError')
    temporaryError.code = temporaryErrors[0]

    const error = new Error('error')

    const query = {}
    const promise = sinon.stub()
    promise.onCall(0).returns(Promise.reject(temporaryError))
    promise.returns(Promise.reject(error))

    const documentClient = {
      query: sinon.stub().returns({
        promise
      })
    }

    try {
      await executeSingleQuery(documentClient, query)
      throw new Error('failure')
    } catch (err) {
      expect(err).toEqual(error)
    }

    sinon.assert.callCount(promise, 2)
  })
})
