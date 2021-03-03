import saveEvent from '../src/save-event'
import escapeId from '../src/escape-id'
import escape from '../src/escape'
import isTimeoutError from '../src/is-timeout-error'
import { AdapterPool } from '../src/types'

const databaseName = 'databaseName'
const eventsTableName = 'eventsTableName'

const event = {
  aggregateId: 'aggregateId',
  aggregateVersion: 1,
  type: 'TEST',
  payload: { key: 'value' },
  timestamp: 1,
}

test('method "saveEvent" should throw an exception "ConcurrentError"', async () => {
  const executeStatement = jest
    .fn()
    .mockRejectedValue(new Error('Conflict "aggregateIdAndVersion"'))

  const pool: AdapterPool = {
    databaseName,
    eventsTableName,
    executeStatement,
    isTimeoutError,
    escapeId,
    escape,
  } as any

  try {
    await saveEvent(pool, event)
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error.name).toEqual('ConcurrentError')
  }
})

test('method "saveEvent" should throw an exception "Event store is frozen"', async () => {
  const executeStatement = jest
    .fn()
    .mockRejectedValue(new Error('subquery used as an expression'))

  const pool: AdapterPool = {
    databaseName,
    eventsTableName,
    executeStatement,
    isTimeoutError,
    escapeId,
    escape,
  } as any

  try {
    await saveEvent(pool, event)
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error.message).toEqual('Event store is frozen')
  }
})

test('method "saveEvent" should save an event after StatementTimeoutException', async () => {
  let insertCounter = 0
  let selectCounter = 0
  const executeStatement = jest.fn().mockImplementation(async (sql) => {
    if (/INSERT/i.test(sql)) {
      if (insertCounter++ < 3) {
        throw new Error('StatementTimeoutException')
      }
    } else if (/SELECT/i.test(sql)) {
      if (selectCounter++ < 3) {
        throw new Error('StatementTimeoutException')
      }
      return [
        {
          aggregateId: event.aggregateId,
          aggregateVersion: event.aggregateVersion,
          type: event.type,
          payload: JSON.stringify(event.payload),
        },
      ]
    } else {
      throw new Error(sql)
    }
  })

  const pool: AdapterPool = {
    databaseName,
    eventsTableName,
    executeStatement,
    isTimeoutError,
    escapeId,
    escape,
  } as any

  await saveEvent(pool, event)

  expect(executeStatement).toBeCalled()
})

test('method "saveEvent" should throw an exception "ConcurrentError" after StatementTimeoutException', async () => {
  let insertCounter = 0
  let selectCounter = 0
  const executeStatement = jest.fn().mockImplementation(async (sql) => {
    if (/INSERT/i.test(sql)) {
      if (insertCounter++ < 3) {
        throw new Error('StatementTimeoutException')
      }
    } else if (/SELECT/i.test(sql)) {
      if (selectCounter++ < 3) {
        throw new Error('StatementTimeoutException')
      }
      return [
        {
          aggregateId: event.aggregateId,
          aggregateVersion: event.aggregateVersion,
          type: 'ANOTHER_TYPE',
          payload: 'another-payload',
        },
      ]
    } else {
      throw new Error(sql)
    }
  })

  const pool: AdapterPool = {
    databaseName,
    eventsTableName,
    executeStatement,
    isTimeoutError,
    escapeId,
    escape,
  } as any

  try {
    await saveEvent(pool, event)
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error.name).toEqual('ConcurrentError')
  }
})

test('method "saveEvent" should throw an exception "Event store is frozen" after StatementTimeoutException', async () => {
  let insertCounter = 0
  const executeStatement = jest.fn().mockImplementation(async (sql) => {
    if (/INSERT/i.test(sql)) {
      if (insertCounter++ < 3) {
        throw new Error('StatementTimeoutException')
      }
      throw new Error('subquery used as an expression')
    } else if (/SELECT/i.test(sql)) {
      return []
    } else {
      throw new Error(sql)
    }
  })

  const pool: AdapterPool = {
    databaseName,
    eventsTableName,
    executeStatement,
    isTimeoutError,
    escapeId,
    escape,
  } as any

  try {
    await saveEvent(pool, event)
    return Promise.reject('Test failed')
  } catch (error) {
    expect(error.message).toEqual('Event store is frozen')
  }
})
