import { INT8_SQL_TYPE } from './constants'

const split2RegExp = /.{1,2}(?=(.{2})+(?!.))|.{1,2}$/g

const loadEventsByCursor = async (
  { executeStatement, escapeId, escape, tableName, databaseName },
  { eventTypes, aggregateIds, cursor, limit },
  callback
) => {
  const injectString = value => `${escape(value)}`
  const injectNumber = value => `${+value}`
  const batchSize = limit != null ? Math.min(limit, 0x7fffffff) : 0x7fffffff

  const cursorBuffer =
    cursor != null ? Buffer.from(cursor, 'base64') : Buffer.alloc(1536, 0)
  const vectorConditions = []
  for (let i = 0; i < cursorBuffer.length / 6; i++) {
    vectorConditions.push(
      `x'${cursorBuffer
        .slice(i * 6, (i + 1) * 6)
        .toString('hex')}'::${INT8_SQL_TYPE}`
    )
  }

  const queryConditions = []
  if (eventTypes != null) {
    queryConditions.push(
      `${escapeId('type')} IN (${eventTypes.map(injectString)})`
    )
  }
  if (aggregateIds != null) {
    queryConditions.push(
      `${escapeId('aggregateId')} IN (${aggregateIds.map(injectString)})`
    )
  }

  const resultQueryCondition = `WHERE ${
    queryConditions.length > 0 ? `${queryConditions.join(' AND ')} AND (` : ''
  }
    ${vectorConditions
      .map(
        (threadCounter, threadId) =>
          `${escapeId('threadId')} = ${injectNumber(threadId)} AND ${escapeId(
            'threadCounter'
          )} >= ${threadCounter} `
      )
      .join(' OR ')}
    ${queryConditions.length > 0 ? ')' : ''}`

  const sqlQuery = [
    `SELECT * FROM ${escapeId(databaseName)}.${escapeId(tableName)}`,
    `${resultQueryCondition}`,
    `ORDER BY ${escapeId('timestamp')} ASC`,
    `LIMIT ${+batchSize}`
  ].join('\n')

  const rows = await executeStatement(sqlQuery)

  for (const event of rows) {
    const threadId = +event.threadId
    const threadCounter = +event.threadCounter
    event[Symbol.for('threadCounter')] = threadCounter
    event[Symbol.for('threadId')] = threadId

    const oldThreadCounter = parseInt(
      vectorConditions[threadId].substring(
        2,
        vectorConditions[threadId].length - (INT8_SQL_TYPE.length + 3)
      ),
      16
    )

    vectorConditions[threadId] = `x'${Math.max(
      threadCounter + 1,
      oldThreadCounter
    )
      .toString(16)
      .padStart(12, '0')}'::${INT8_SQL_TYPE}`

    event.aggregateVersion = +event.aggregateVersion
    event.timestamp = +event.timestamp

    delete event.totalEventSize
    delete event.eventSize
    delete event.threadCounter
    delete event.threadId

    await callback(event)
  }

  const nextConditionsBuffer = Buffer.alloc(1536)
  let byteIndex = 0

  for (const threadCounter of vectorConditions) {
    const threadCounterBytes = threadCounter
      .substring(2, threadCounter.length - (INT8_SQL_TYPE.length + 3))
      .match(split2RegExp)
    for (const byteHex of threadCounterBytes) {
      nextConditionsBuffer[byteIndex++] = Buffer.from(byteHex, 'hex')[0]
    }
  }

  return nextConditionsBuffer.toString('base64')
}

export default loadEventsByCursor
