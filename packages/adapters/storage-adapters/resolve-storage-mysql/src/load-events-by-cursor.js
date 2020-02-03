const split2RegExp = /.{1,2}(?=(.{2})+(?!.))|.{1,2}$/g

const loadEventsByCursor = async (
  { connection, escapeId, escape, tableName },
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
      `0x${cursorBuffer.slice(i * 6, (i + 1) * 6).toString('hex')}`
    )
  }

  const queryConditions = []
  if (eventTypes != null) {
    queryConditions.push(`\`type\` IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    queryConditions.push(
      `\`aggregateId\` IN (${aggregateIds.map(injectString)})`
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

  const [rows] = await connection.query(
    `SELECT * FROM ${escapeId(tableName)} ${resultQueryCondition}
    ORDER BY ${escapeId('timestamp')} ASC,
    ${escapeId('threadCounter')} ASC
    LIMIT 0, ${+batchSize}`
  )

  for (const event of rows) {
    const threadId = +event.threadId
    const threadCounter = +event.threadCounter
    event[Symbol.for('threadCounter')] = threadCounter
    event[Symbol.for('threadId')] = threadId

    const oldThreadCounter = parseInt(
      vectorConditions[threadId].substring(2),
      16
    )

    vectorConditions[threadId] = `0x${Math.max(
      threadCounter + 1,
      oldThreadCounter
    )
      .toString(16)
      .padStart(12, '0')}`

    Object.setPrototypeOf(event, Object.prototype)

    delete event.threadId
    delete event.threadCounter

    await callback(event)
  }

  const nextConditionsBuffer = Buffer.alloc(1536)
  let byteIndex = 0

  for (const threadCounter of vectorConditions) {
    const threadCounterBytes = threadCounter.substring(2).match(split2RegExp)
    for (const byteHex of threadCounterBytes) {
      nextConditionsBuffer[byteIndex++] = Buffer.from(byteHex, 'hex')[0]
    }
  }

  return nextConditionsBuffer.toString('base64')
}

export default loadEventsByCursor
