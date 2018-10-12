import sinon from 'sinon'
import { ConcurrentError } from 'resolve-storage-base'
import saveEvent from '../src/save-event'

test('save event should store event in eventstore if success', async () => {
  const event = {
    type: 'event_type',
    aggregateId: 'aggregate_id',
    aggregateVersion: 123
  }

  const insert = sinon.stub().callsFake(async () => null)

  const pool = {
    disposed: false,
    promiseInvoke: async (func, ...args) => await func(...args),
    db: { insert }
  }

  await saveEvent(pool, event)

  expect(insert.callCount).toEqual(1)
  expect(insert.firstCall.args).toEqual([
    {
      ...event,
      aggregateIdAndVersion: `${event.aggregateId}:${event.aggregateVersion}`
    }
  ])
})

test('save event should throw ConcurrentError on duplicate aggregateVersion', async () => {
  const event = {
    type: 'event_type',
    aggregateId: 'aggregate_id',
    aggregateVersion: 123
  }

  const insert = sinon.stub().callsFake(async () => {
    const error = new Error('uniqueViolated')
    error.errorType = 'uniqueViolated'
    throw error
  })

  const pool = {
    disposed: false,
    promiseInvoke: async (func, ...args) => await func(...args),
    db: { insert }
  }

  try {
    await saveEvent(pool, event)

    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toBeInstanceOf(ConcurrentError)

    expect(error.message).toEqual(
      `Can not save the event because aggregate '${
        event.aggregateId
      }' is not actual at the moment. Please retry later.`
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
  const insert = sinon.stub().callsFake(async () => {
    throw customDbError
  })

  const pool = {
    disposed: false,
    promiseInvoke: async (func, ...args) => await func(...args),
    db: { insert }
  }

  try {
    await saveEvent(pool, event)

    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toEqual(customDbError)
  }
})
