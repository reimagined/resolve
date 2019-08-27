import stream from 'stream'
import ndjson from 'ndjson'
import through from 'through2'

const injectString = ({ escape }, value) => `${escape(value)}`
const injectNumber = (pool, value) => `${+value}`

function EventStream(pool, cursor = 0) {
  const filter = {}

  pool.validateEventFilter(filter)

  stream.Readable.call(this, { objectMode: true })

  this.pool = pool
  this.filter = filter

  this.cursor = cursor
  this.offset = cursor

  this.injectString = injectString.bind(this, pool)
  this.injectNumber = injectNumber.bind(this, pool)

  this.reader = null
  this.rows = []
}

EventStream.prototype = Object.create(stream.Readable.prototype)
EventStream.prototype.constructor = stream.Readable

EventStream.prototype.processEvents = function() {
  for (
    let event = this.rows.shift();
    event != null;
    event = this.rows.shift()
  ) {
    if (this.destroyed) {
      this.rows.length = 0
      return
    } else {
      const isPaused =
        this.push({
          ...event,
          payload: JSON.parse(event.payload)
        }) === false
      this.cursor = event.eventId

      if (isPaused) {
        this.reader = null
        return
      }
    }
  }
}

EventStream.prototype._read = function() {
  this.processEvents()

  if (this.reader == null) {
    const nextReader = (async () => {
      await this.pool.waitConnectAndInit()

      const { executeStatement, escapeId, tableName, databaseName } = this.pool

      const { eventTypes, aggregateIds, startTime, finishTime } = this.filter

      const batchSize = 10

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

      while (true) {
        if (this.reader !== nextReader) {
          return
        }

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
          `    OFFSET ${this.offset}`,
          `    LIMIT ${+batchSize}`,
          `  ) ${escapeId('filteredEvents')}`,
          `)`,
          `SELECT * FROM ${escapeId('cte')}`,
          `WHERE ${escapeId('cte')}.${escapeId('totalEventSize')} < 512000`,
          `ORDER BY ${escapeId('cte')}.${escapeId('eventId')} ASC`
        ].join(' ')

        const nextRows = await executeStatement(query)

        if (this.reader !== nextReader) {
          return
        }

        if (nextRows.length > 0) {
          this.offset = nextRows[nextRows.length - 1].eventId
        }
        this.rows.push(...nextRows)

        this.processEvents()

        if (nextRows.length === 0) {
          if (!this.destroyed) {
            this.push(null)
          }
          return
        }
      }
    })()

    this.reader = nextReader
  }
}

const exportStream = (
  pool,
  { cursor, bufferSize = Number.POSITIVE_INFINITY } = {}
) => {
  const jsonStream = ndjson.serialize()

  const eventStream = new EventStream(pool, cursor)

  let size = 0

  let lastChunk = null
  const resultStream = through.obj(
    (chunk, encoding, callback) => {
      lastChunk = chunk
      const byteLength = Buffer.byteLength(chunk)
      if (size + byteLength > bufferSize) {
        eventStream.destroy()
        resultStream.cursor = JSON.parse(chunk).eventId
        callback(false, null)
      } else {
        size += byteLength
        callback(false, chunk)
      }
    },
    callback => {
      eventStream.destroy()
      jsonStream.destroy()

      if (resultStream.cursor == null) {
        resultStream.cursor = JSON.parse(lastChunk).eventId + 1
      }

      callback()
    }
  )

  eventStream.pipe(jsonStream)
  jsonStream.pipe(resultStream)

  return resultStream
}

export default exportStream
