const stream = require('stream')

const injectString = ({ escape }, value) => `${escape(value)}`
const injectNumber = (pool, value) => `${+value}`

function EventStream(pool, cursor = 0) {
  const filter = {}

  pool.validateEventFilter(filter)

  stream.Readable.call(this, { objectMode: true })

  this.pool = pool
  this.filter = filter

  this.cursor = cursor

  this.injectString = injectString.bind(this, pool)
  this.injectNumber = injectNumber.bind(this, pool)

  this.reader = null
}

EventStream.prototype = Object.create(stream.Readable.prototype)
EventStream.prototype.constructor = stream.Readable

EventStream.prototype._read = function() {
  if (this.reader == null) {
    this.reader = (async () => {
      await this.pool.waitConnectAndInit()

      const { executeStatement, escapeId, tableName, databaseName } = this.pool

      const {
        eventTypes,
        aggregateIds,
        startTime,
        finishTime,
        maxEventsByTimeframe = Number.POSITIVE_INFINITY
      } = this.filter

      const batchSize = 100

      const queryConditions = []
      if (eventTypes != null) {
        queryConditions.push(
          `${escapeId('type')} IN (${eventTypes.map(this.injectString)})`
        )
      }
      if (aggregateIds != null) {
        queryConditions.push(
          `${escapeId('aggregateId')} IN (${aggregateIds.map(
            this.injectString
          )})`
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
        queryConditions.length > 0
          ? `WHERE ${queryConditions.join(' AND ')}`
          : ''

      let initialTimestamp = null

      loop: while (true) {
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

        const rows = await executeStatement(query)

        for (const event of rows) {
          if (initialTimestamp == null) {
            initialTimestamp = event.timestamp
          }

          if (
            this.cursor++ > maxEventsByTimeframe &&
            event.timestamp !== initialTimestamp
          ) {
            break loop
          }

          if (!this.destroyed) {
            this.push({
              ...event,
              payload: JSON.parse(event.payload)
            })
          } else {
            return
          }
        }

        if (rows.length === 0) {
          break
        }
      }
      if (!this.destroyed) {
        this.push(null)
      }
    })()
  }
}

const exportStream = (pool, cursor) => new EventStream(pool, cursor)

export default exportStream
