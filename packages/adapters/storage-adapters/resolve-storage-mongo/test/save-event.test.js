import sinon from 'sinon'
import { ConcurrentError } from 'resolve-storage-base'
import saveEvent from '../src/save-event'

test('save event should store event in eventstore if success', async () => {
  const event = {
    type: 'event_type',
    aggregateId: 'aggregate_id',
    aggregateVersion: 123
  }

  const insertOne = sinon.stub().callsFake(async () => null)
  const isFrozen = sinon.stub().callsFake(async () => null)

  const pool = {
    collection: { insertOne },
    isFrozen
  }

  await saveEvent(pool, event)

  expect(insertOne.callCount).toEqual(1)
  expect(insertOne.firstCall.args).toEqual([event])
})

test('save event should throw ConcurrentError on duplicate aggregateVersion', async () => {
  const event = {
    type: 'event_type',
    aggregateId: 'aggregate_id',
    aggregateVersion: 123
  }

  const insertOne = sinon.stub().callsFake(async () => {
    const error = new Error('Test error')
    error.code = 11000
    throw error
  })
  const isFrozen = sinon.stub().callsFake(async () => null)

  const pool = {
    collection: { insertOne },
    isFrozen
  }

  try {
    await saveEvent(pool, event)

    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(ConcurrentError)

    expect(error.message).toEqual(
      `Can not save the event because aggregate '${event.aggregateId}' is not actual at the moment. Please retry later.`
    )
  }
})

test('save event should re-throw custom db error', async () => {
  const event = {
    type: 'event_type',
    aggregateId: 'aggregate_id',
    aggregateVersion: 123
  }

  const customDbError = new Error()
  const insertOne = sinon.stub().callsFake(async () => {
    throw customDbError
  })
  const isFrozen = sinon.stub().callsFake(async () => null)

  const pool = {
    collection: { insertOne },
    isFrozen
  }

  try {
    await saveEvent(pool, event)

    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toEqual(customDbError)
  }
})
