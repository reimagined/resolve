const emptyTrueCondition = ' 1=1 '

const loadEvents = async (pool, filter, callback) => {
  const { connection, escapeId, escape, tableName } = pool
  const { eventTypes, aggregateIds, startTime, finishTime } = filter
  const injectString = value => `"${escape(value)}"`
  const injectNumber = value => `${+value}`

  // https://github.com/sidorares/node-mysql2/issues/677
  const streamConnection = connection.connection

  const stream = await streamConnection.query(
    `SELECT * FROM ${escapeId(tableName)} WHERE ${
      eventTypes != null
        ? `\`type\` IN (${eventTypes.map(injectString)})`
        : emptyTrueCondition
    } AND ${
      aggregateIds != null
        ? `\`aggregateId\` IN (${aggregateIds.map(injectString)})`
        : emptyTrueCondition
    } AND ${
      startTime != null
        ? `\`timestamp\` > ${injectNumber(startTime)}`
        : emptyTrueCondition
    } AND ${
      finishTime != null
        ? `\`timestamp\` < ${injectNumber(finishTime)}`
        : emptyTrueCondition
    } ORDER BY \`timestamp\` ASC, \`aggregateVersion\` ASC`
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
