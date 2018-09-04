import sinon from 'sinon'
import mysql, { _setLastResult, _reset } from 'mysql2/promise'
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

    const executor = (await mysql.createConnection.firstCall.returnValue)
      .execute

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `CREATE TABLE IF NOT EXISTS table(
        \`timestamp\` BIGINT NOT NULL,
        \`aggregateId\` VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        \`aggregateVersion\` BIGINT NOT NULL,
        \`type\` VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        \`payload\` JSON NULL,
        PRIMARY KEY(\`aggregateId\`, \`aggregateVersion\`),
        INDEX USING BTREE(\`aggregateId\`),
        INDEX USING BTREE(\`aggregateVersion\`),
        INDEX USING BTREE(\`type\`),
        INDEX USING BTREE(\`timestamp\`)
        )`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([])

    expect(format(executor.secondCall.args[0])).toEqual(
      format(
        `INSERT INTO table (
          \`timestamp\`,
          \`aggregateId\`,
          \`aggregateVersion\`,
          \`type\`,
          \`payload\`
        )
        VALUES  (?, ?, ?, ?, ?)`
      )
    )

    expect(executor.secondCall.args[1]).toEqual([
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

    const executor = (await mysql.createConnection.firstCall.returnValue)
      .execute

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `CREATE TABLE IF NOT EXISTS table(
          \`timestamp\` BIGINT NOT NULL,
          \`aggregateId\` VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          \`aggregateVersion\` BIGINT NOT NULL,
          \`type\` VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          \`payload\` JSON NULL,
          PRIMARY KEY(\`aggregateId\`, \`aggregateVersion\`),
          INDEX USING BTREE(\`aggregateId\`),
          INDEX USING BTREE(\`aggregateVersion\`),
          INDEX USING BTREE(\`type\`),
          INDEX USING BTREE(\`timestamp\`)
          )`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([])

    expect(format(executor.secondCall.args[0])).toEqual(
      format(`SELECT * FROM table
      WHERE
        \`timestamp\` > ? AND
        \`type\` IN (?, ?)
      ORDER BY
        \`timestamp\` ASC,
        \`aggregateVersion\` ASC
      `)
    )

    expect(executor.secondCall.args[1]).toEqual([
      100,
      'EVENT_TYPE_1',
      'EVENT_TYPE_2'
    ])

    expect(callback.firstCall.args[0]).toEqual(result[0][0])
    expect(callback.secondCall.args[0]).toEqual(result[0][1])
  })

  it('should load events by aggregate ids', async () => {
    const adapter = createAdapter(connectionOptions)
    const aggregateIds = ['AGGREGATE_ID_1', 'AGGREGATE_ID_2']

    const callback = sinon.stub()
    const result = [[{ ...testEvent }, { ...testEvent, aggregateVersion: 6 }]]
    _setLastResult(result)
    await adapter.loadEventsByAggregateIds(aggregateIds, callback, 100)

    const executor = (await mysql.createConnection.firstCall.returnValue)
      .execute

    expect(format(executor.firstCall.args[0])).toEqual(
      format(
        `CREATE TABLE IF NOT EXISTS table(
          \`timestamp\` BIGINT NOT NULL,
          \`aggregateId\` VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          \`aggregateVersion\` BIGINT NOT NULL,
          \`type\` VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          \`payload\` JSON NULL,
          PRIMARY KEY(\`aggregateId\`, \`aggregateVersion\`),
          INDEX USING BTREE(\`aggregateId\`),
          INDEX USING BTREE(\`aggregateVersion\`),
          INDEX USING BTREE(\`type\`),
          INDEX USING BTREE(\`timestamp\`)
          )`
      )
    )

    expect(executor.firstCall.args[1]).toEqual([])

    expect(format(executor.secondCall.args[0])).toEqual(
      format(
        `SELECT * FROM table
        WHERE
          \`timestamp\` > ? AND
          \`aggregateId\` IN (?, ?)
        ORDER BY
          \`timestamp\` ASC,
          \`aggregateVersion\` ASC
        `
      )
    )

    expect(executor.secondCall.args[1]).toEqual([
      100,
      'AGGREGATE_ID_1',
      'AGGREGATE_ID_2'
    ])

    expect(callback.firstCall.args[0]).toEqual(result[0][0])
    expect(callback.secondCall.args[0]).toEqual(result[0][1])
  })
})
