const loadEvents = async (
  { connection, escapeId, escape, tableName },
  { eventTypes, aggregateIds, startTime, finishTime },
  callback
) => {
  const injectString = value => `${escape(value)}`
  const injectNumber = value => `${+value}`

  // https://github.com/sidorares/node-mysql2/issues/677
  const streamConnection = connection.connection

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

  const stream = streamConnection.query(
    `SELECT * FROM ${escapeId(tableName)} ${resultQueryCondition}
    ORDER BY \`timestamp\` ASC, \`aggregateVersion\` ASC`
  )

  let lastError = null

  try {
    await new Promise((resolve, reject) => {
      stream.on('error', reject)
      stream.on('end', resolve)
      stream.on('result', async row => {
        try {
          streamConnection.pause()
          await callback(Object.setPrototypeOf(row, Object.prototype))
          streamConnection.resume()
        } catch (e) {
          reject(e)
        }
      })
    })
  } catch (error) {
    lastError = error
    stream.destroy()
  }

  if (lastError != null) {
    throw lastError
  }
}

export default loadEvents
