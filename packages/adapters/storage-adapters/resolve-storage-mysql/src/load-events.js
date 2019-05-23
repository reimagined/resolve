const loadEvents = async (
  { connection, escapeId, escape, tableName },
  {
    eventTypes,
    aggregateIds,
    startTime,
    finishTime,
    maxEventsByTimeframe = Number.POSITIVE_INFINITY
  },
  callback
) => {
  const injectString = value => `${escape(value)}`
  const injectNumber = value => `${+value}`
  const batchSize = 50

  const queryConditions = []
  if (eventTypes != null) {
    queryConditions.push(`\`type\` IN (${eventTypes.map(injectString)})`)
  }
  if (aggregateIds != null) {
    queryConditions.push(
      `\`aggregateId\` IN (${aggregateIds.map(injectString)})`
    )
  }
  if (startTime != null) {
    queryConditions.push(`\`timestamp\` > ${injectNumber(startTime)}`)
  }
  if (finishTime != null) {
    queryConditions.push(`\`timestamp\` < ${injectNumber(finishTime)}`)
  }

  const resultQueryCondition =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : ''

  let initialTimestamp = null
  let countEvents = 0

  loop: for (let skipCount = 0; ; skipCount++) {
    const [rows] = await connection.query(
      `SELECT * FROM ${escapeId(tableName)} ${resultQueryCondition}
      ORDER BY ${escapeId('timestamp')} ASC,
      ${escapeId('aggregateVersion')} ASC
      LIMIT ${+(skipCount * batchSize)}, ${+batchSize}`
    )

    for (const event of rows) {
      Object.setPrototypeOf(event, Object.prototype)

      if (initialTimestamp == null) {
        initialTimestamp = event.timestamp
      }

      if (
        countEvents++ > maxEventsByTimeframe &&
        event.timestamp !== initialTimestamp
      ) {
        break loop
      }

      await callback(event)
    }

    if (rows.length < batchSize) {
      break
    }
  }
}

export default loadEvents
