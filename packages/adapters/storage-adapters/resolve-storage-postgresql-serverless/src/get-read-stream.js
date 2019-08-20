const stream = require('stream')

const injectString = ({ escape }, value) => `${escape(value)}`
const injectNumber = (pool, value) => `${+value}`

function EventStream(pool, filter, cursor = 0) {
  stream.Readable.call(this, { objectMode: true })

  this.pool = pool
  this.filter = filter

  this.cursor = cursor

  this.injectString = injectString.bind(this, pool)
  this.injectNumber = injectNumber.bind(this, pool)
}

EventStream.prototype = Object.create(stream.Readable.prototype)
EventStream.prototype.constructor = stream.Readable

EventStream.prototype._read = async function() {
  await this.pool.waitConnectAndInit()

  const { executeStatement, escapeId, tableName, databaseName } = this.pool

  const {
    eventTypes,
    aggregateIds,
    startTime,
    finishTime,
    maxEventsByTimeframe = Number.POSITIVE_INFINITY
  } = this.filter

  const batchSize = 50

  const queryConditions = []
  if (eventTypes != null) {
    queryConditions.push(
      `${escapeId('type')} IN (${eventTypes.map(this.injectString)})`
    )
  }
  if (aggregateIds != null) {
    queryConditions.push(
      `${escapeId('aggregateId')} IN (${aggregateIds.map(this.injectString)})`
    )
  }
  if (startTime != null) {
    queryConditions.push(
      `${escapeId('timestamp')} > ${this.injectNumber(startTime)}`
    )
  }
  if (finishTime != null) {
    queryConditions.push(
      `${escapeId('timestamp')} < ${this.injectNumber(finishTime)}`
    )
  }

  const resultQueryCondition =
    queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : ''

  let initialTimestamp = null

  const query = [
    `WITH ${escapeId('cte')} AS (`,
    `  SELECT ${escapeId('filteredEvents')}.*,`,
    `  SUM(${escapeId('filteredEvents')}.${escapeId('eventSize')})`,
    `  OVER (ORDER BY ${escapeId('filteredEvents')}.${escapeId(
      'eventId'
    )}) AS ${escapeId('totalEventSize')}`,
    `  FROM (`,
    `    SELECT * FROM ${escapeId(databaseName)}.${escapeId(
      tableName
    )} ${resultQueryCondition}`,
    `    ORDER BY ${escapeId('eventId')} ASC`,
    `    OFFSET ${this.cursor}`,
    `    LIMIT ${+batchSize}`,
    `  ) ${escapeId('filteredEvents')}`,
    `)`,
    `SELECT * FROM ${escapeId('cte')}`,
    `WHERE ${escapeId('cte')}.${escapeId('totalEventSize')} < 512000`,
    `ORDER BY ${escapeId('cte')}.${escapeId('eventId')} ASC`
  ].join(' ')

  // console.log('query')
  // console.log(query)

  const rows = await executeStatement(query)

  // console.log('rows')
  // console.log(rows)

  for (const event of rows) {
    if (initialTimestamp == null) {
      initialTimestamp = event.timestamp
    }

    if (
      this.cursor++ > maxEventsByTimeframe &&
      event.timestamp !== initialTimestamp
    ) {
      if (!this.destroyed) {
        this.push(null)
      }
      return
    }

    if (!this.destroyed) {
      this.push({
        ...event,
        payload: JSON.parse(event.payload)
      })
    }
  }

  if (rows.length === 0) {
    if (!this.destroyed) {
      this.push(null)
    }
  }
}

const getReadStream = (pool, filter, cursor) =>
  new EventStream(pool, filter, cursor)

export default getReadStream
