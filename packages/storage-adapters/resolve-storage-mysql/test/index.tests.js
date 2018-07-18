import sinon from 'sinon'
import { expect } from 'chai'
import mysql, { _setLastResult, _reset } from 'mysql2'
import sqlFormatter from 'sql-formatter'
import createAdapter from '../src'

const connectionOptions = {
  tableName: 'table',
  host: 'host',
  port: 1234,
  user: 'user',
  password: 'pass',
  database: 'db'
}

const testEvent = {
  timestamp: 100,
  aggregateId: 'aggregate-id',
  aggregateVersion: 5,
  type: 'event-type',
  payload: {}
}

describe('es-mysql', () => {
  const format = sqlFormatter.format.bind(sqlFormatter)
  afterEach(() => {
    _reset()
  })

  it('should save event', async () => {
    const adapter = createAdapter(connectionOptions)
    await adapter.saveEvent(testEvent)

    const executor = (await mysql.createConnection.firstCall.returnValue).execute

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `CREATE TABLE IF NOT EXISTS table(
        timestamp BIGINT NOT NULL,
        aggregateId VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        aggregateVersion BIGINT NOT NULL,
        type VARCHAR(700) VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        payload JSON NULL,
        PRIMARY KEY(aggregateId, aggregateVersion),
        INDEX USING BTREE(type),
        INDEX USING BTREE(timestamp)
      )`
      )
    )

    expect(executor.firstCall.args[1]).to.be.deep.equal([])

    expect(format(executor.secondCall.args[0])).to.be.equal(
      format(
        `INSERT INTO table (timestamp, aggregateId, aggregateVersion, type, payload )
         VALUES  (?, ?, ?, ?, ?)`
      )
    )

    expect(executor.secondCall.args[1]).to.be.deep.equal([
      testEvent.timestamp,
      testEvent.aggregateId,
      testEvent.aggregateVersion,
      testEvent.type,
      testEvent.payload
    ])
  })

  it('should load events by types', async () => {
    const adapter = createAdapter(connectionOptions)
    const eventTypes = ['EVENT_TYPE_1', 'EVENT_TYPE_2']

    const callback = sinon.stub()
    const result = [[{ ...testEvent }, { ...testEvent, aggregateVersion: 6 }]]
    _setLastResult(result)
    await adapter.loadEventsByTypes(eventTypes, callback, 100)

    const executor = (await mysql.createConnection.firstCall.returnValue).execute

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `CREATE TABLE IF NOT EXISTS table(
        timestamp BIGINT NOT NULL,
        aggregateId VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        aggregateVersion BIGINT NOT NULL,
        type VARCHAR(700) VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        payload JSON NULL,
        PRIMARY KEY(aggregateId, aggregateVersion),
        INDEX USING BTREE(type),
        INDEX USING BTREE(timestamp)
      )`
      )
    )

    expect(executor.firstCall.args[1]).to.be.deep.equal([])

    expect(format(executor.secondCall.args[0])).to.be.equal(
      format(`SELECT * FROM  table WHERE timestamp > ? AND type IN (?, ?)`)
    )

    expect(executor.secondCall.args[1]).to.be.deep.equal([100, 'EVENT_TYPE_1', 'EVENT_TYPE_2'])

    expect(callback.firstCall.args[0]).to.be.equal(result[0][0])
    expect(callback.secondCall.args[0]).to.be.equal(result[0][1])
  })

  it('should load events by aggregate ids', async () => {
    const adapter = createAdapter(connectionOptions)
    const aggregateIds = ['AGGREGATE_ID_1', 'AGGREGATE_ID_2']

    const callback = sinon.stub()
    const result = [[{ ...testEvent }, { ...testEvent, aggregateVersion: 6 }]]
    _setLastResult(result)
    await adapter.loadEventsByAggregateIds(aggregateIds, callback, 100)

    const executor = (await mysql.createConnection.firstCall.returnValue).execute

    expect(format(executor.firstCall.args[0])).to.be.equal(
      format(
        `CREATE TABLE IF NOT EXISTS table(
        timestamp BIGINT NOT NULL,
        aggregateId VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        aggregateVersion BIGINT NOT NULL,
        type VARCHAR(700) VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        payload JSON NULL,
        PRIMARY KEY(aggregateId, aggregateVersion),
        INDEX USING BTREE(type),
        INDEX USING BTREE(timestamp)
      )`
      )
    )

    expect(executor.firstCall.args[1]).to.be.deep.equal([])

    expect(format(executor.secondCall.args[0])).to.be.equal(
      format(`SELECT * FROM  table WHERE timestamp > ? AND aggregateId IN (?, ?)`)
    )

    expect(executor.secondCall.args[1]).to.be.deep.equal([100, 'AGGREGATE_ID_1', 'AGGREGATE_ID_2'])

    expect(callback.firstCall.args[0]).to.be.equal(result[0][0])
    expect(callback.secondCall.args[0]).to.be.equal(result[0][1])
  })
})
