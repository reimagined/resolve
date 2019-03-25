import sinon from 'sinon'
import { ConcurrentError } from 'resolve-storage-base'

import saveEvent from '../src/save-event'
import {
  globalPartitionKey,
  temporaryErrors,
  duplicateError
} from '../src/constants'

describe('method "saveEvent"', () => {
  test('should save event', async () => {
    const encodeEmptyStrings = sinon.stub().callsFake(event => event)
    const documentClient = {
      put: sinon.stub().returns({
        promise: sinon.stub().returns(Promise.resolve())
      })
    }
    const tableName = 'tableName'
    const event = { type: 'type', aggregateId: 'aggregateId' }

    await saveEvent(
      {
        encodeEmptyStrings,
        documentClient,
        tableName
      },
      event
    )

    sinon.assert.calledWith(documentClient.put, {
      TableName: tableName,
      Item: {
        globalPartitionKey: globalPartitionKey,
        ...event
      },
      ConditionExpression:
        'attribute_not_exists(aggregateId) AND attribute_not_exists(aggregateVersion)'
    })
  })

  test('should throw temporaryError, ConcurrentError and error', async () => {
    const encodeEmptyStrings = sinon.stub().callsFake(event => event)
    const temporaryError = new Error()
    temporaryError.code = temporaryErrors[0]
    const concurrentError = new Error()
    concurrentError.code = duplicateError
    const error = new Error('other error')

    const promise = sinon.stub()
    promise.onCall(0).returns(Promise.reject(temporaryError))
    promise.onCall(1).returns(Promise.reject(concurrentError))
    promise.returns(Promise.reject(error))

    const documentClient = {
      put: sinon.stub().returns({
        promise
      })
    }
    const tableName = 'tableName'
    const event = { type: 'type', aggregateId: 'aggregateId' }

    try {
      await saveEvent(
        {
          encodeEmptyStrings,
          documentClient,
          tableName
        },
        event
      )
      throw new Error('failure')
    } catch (err) {
      expect(err).toEqual(
        new ConcurrentError(
          `Can not save the event because aggregate '${
            event.aggregateId
          }' is not actual at the moment. Please retry later.`
        )
      )
    }

    sinon.assert.callCount(documentClient.put, 2)

    try {
      await saveEvent(
        {
          encodeEmptyStrings,
          documentClient,
          tableName
        },
        event
      )
      throw new Error('failure')
    } catch (err) {
      expect(err).toEqual(error)
    }
  })
})
