import sinon from 'sinon'
import { ConcurrentError } from 'resolve-storage-base'
import saveEvent from '../src/save-event'

test('save event should store event in eventstore if success', async () => {
  const event = {
    type: 'event_type',
    aggregateId: 'aggregate_id',
    aggregateVersion: 123
  }

  const pool = {
    connection: {
      query: sinon.stub().callsFake(async () => null)
    },
    escapeId: value => `@ESCAPED[${value}]`,
    escape: value => `@ESCAPED[${value}]`,
    tableName: 'tableName'
  }

  await saveEvent(pool, event)

  expect(pool.connection.query.callCount).toEqual(1)

  expect(pool.connection.query.firstCall.args).toMatchSnapshot()
})

test('save event should throw ConcurrentError on duplicate aggregateVersion', async () => {
  const event = {
    type: 'event_type',
    aggregateId: 'aggregate_id',
    aggregateVersion: 123
  }

  const pool = {
    connection: {
      query: sinon.stub().callsFake(async () => {
        const error = new Error('Test error')
        error.errno = 1062
        throw error
      })
    },
    escapeId: value => `@ESCAPED[${value}]`,
    escape: value => `@ESCAPED[${value}]`,
    tableName: 'tableName'
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
  const pool = {
    connection: {
      query: sinon.stub().callsFake(async () => {
        throw customDbError
      })
    },
    escapeId: value => `@ESCAPED[${value}]`,
    escape: value => `@ESCAPED[${value}]`,
    tableName: 'tableName'
  }

  try {
    await saveEvent(pool, event)

    return Promise.reject('Test failed')
  } catch (error) {
    expect(error).toEqual(customDbError)
  }
})
