import stream from 'stream'

import {
  RESERVED_EVENT_SIZE,
  BUFFER_SIZE,
  LONG_STRING_SQL_TYPE
} from './constants'

function EventStream(pool, byteOffset = 0, eventId = 1) {
  stream.Writable.call(this, { objectMode: true })

  this.pool = pool
  this.byteOffset = byteOffset
  this.eventId = eventId
  this.buffer = Buffer.allocUnsafe(BUFFER_SIZE)
  this.beginPosition = 0
  this.endPosition = 0
  this.vacantSize = BUFFER_SIZE
  this.saveEventPromiseSet = new Set()
  this.timestamp = 0
}

EventStream.prototype = Object.create(stream.Writable.prototype)
EventStream.prototype.constructor = stream.Writable
EventStream.prototype.saveEvent = async function(event) {
  const {
    databaseName,
    tableName,
    executeStatement,
    escapeId,
    escape
  } = this.pool

  const serializedEvent = [
    `${escape(event.aggregateId)},`,
    `${+event.aggregateVersion},`,
    `${escape(event.type)},`,
    escape(JSON.stringify(event.payload != null ? event.payload : null))
  ].join('')

  const byteLength = Buffer.byteLength(serializedEvent) + RESERVED_EVENT_SIZE

  await executeStatement(
    [
      `INSERT INTO ${escapeId(databaseName)}.${escapeId(tableName)}(`,
      `${escapeId('eventId')},`,
      `${escapeId('timestamp')},`,
      `${escapeId('aggregateId')},`,
      `${escapeId('aggregateVersion')},`,
      `${escapeId('type')},`,
      `${escapeId('payload')},`,
      `${escapeId('eventSize')}`,
      `) VALUES (`,
      `  ${+event.eventId},`,
      `  ${+event.timestamp},`,
      `  ${serializedEvent},`,
      `  ${byteLength}`,
      `)`
    ].join('')
  )
}

EventStream.prototype.saveSequence = async function() {
  const { databaseName, tableName, executeStatement, escapeId } = this.pool

  await executeStatement(
    [
      `UPDATE ${escapeId(databaseName)}.${escapeId(`${tableName}-sequence`)} `,
      `SET ${escapeId('eventId')} = ${+this.eventId},`,
      `${escapeId(
        'transactionId'
      )} = CAST(txid_current() AS ${LONG_STRING_SQL_TYPE}),`,
      `${escapeId('timestamp')} = ${+this.timestamp}`,
      `WHERE ${escapeId('key')} = 0;`
    ].join('')
  )
}

EventStream.prototype._write = async function(chunk, encoding, callback) {
  await this.pool.waitConnectAndInit()

  if (this.encoding == null) {
    this.encoding = encoding
  } else if (this.encoding !== encoding) {
    throw new Error('Multiple encodings not supported')
  }
  if (chunk.byteLength > this.vacantSize) {
    throw new Error('Buffer overflow')
  }

  if (chunk.byteLength + this.endPosition <= BUFFER_SIZE) {
    chunk.copy(this.buffer, this.endPosition)
  } else {
    chunk.copy(this.buffer, this.endPosition, 0, BUFFER_SIZE - this.endPosition)
    chunk.copy(this.buffer, 0, BUFFER_SIZE - this.endPosition, chunk.byteLength)
  }
  this.endPosition = (this.endPosition + chunk.byteLength) % BUFFER_SIZE
  this.vacantSize -= chunk.byteLength

  if (this.vacantSize === BUFFER_SIZE) {
    callback()
    return
  }

  let eolPosition = 0
  while (true) {
    eolPosition = chunk.indexOf('\n', eolPosition, this.encoding)
    if (eolPosition < 0) {
      break
    } else {
      eolPosition++
    }

    const endEventPosition =
      (BUFFER_SIZE + this.endPosition - chunk.byteLength + eolPosition) %
      BUFFER_SIZE
    let stringifiedEvent = null
    if (this.beginPosition < endEventPosition) {
      stringifiedEvent = this.buffer
        .slice(this.beginPosition, endEventPosition)
        .toString(this.encoding)
      this.vacantSize += endEventPosition - this.beginPosition
    } else {
      stringifiedEvent = this.buffer
        .slice(this.beginPosition, BUFFER_SIZE)
        .toString(this.encoding)
      stringifiedEvent += this.buffer
        .slice(0, endEventPosition)
        .toString(this.encoding)
      this.vacantSize += BUFFER_SIZE - this.beginPosition
      this.vacantSize += endEventPosition
    }

    this.beginPosition = endEventPosition

    const event = JSON.parse(stringifiedEvent)
    event.eventId = this.eventId++
    this.timestamp = Math.max(this.timestamp, event.timestamp)

    const saveEventPromise = this.saveEvent(event)
    void saveEventPromise.then(
      this.saveEventPromiseSet.delete.bind(
        this.saveEventPromiseSet,
        saveEventPromise
      )
    )
    this.saveEventPromiseSet.add(saveEventPromise)
  }

  callback()
}

EventStream.prototype._final = async function(callback) {
  await this.pool.waitConnectAndInit()

  if (this.vacantSize !== BUFFER_SIZE) {
    let stringifiedEvent = null
    if (this.beginPosition < this.endPosition) {
      stringifiedEvent = this.buffer
        .slice(this.beginPosition, this.endPosition)
        .toString(this.encoding)
    } else {
      stringifiedEvent = this.buffer
        .slice(this.beginPosition, BUFFER_SIZE)
        .toString(this.encoding)
      stringifiedEvent += this.buffer
        .slice(0, this.endPosition)
        .toString(this.encoding)
    }

    const event = JSON.parse(stringifiedEvent)
    event.eventId = this.eventId++
    this.timestamp = Math.max(this.timestamp, event.timestamp)

    const saveEventPromise = this.saveEvent(event)
    void saveEventPromise.then(
      this.saveEventPromiseSet.delete.bind(
        this.saveEventPromiseSet,
        saveEventPromise
      )
    )
    this.saveEventPromiseSet.add(saveEventPromise)
  }

  await Promise.all([...this.saveEventPromiseSet, this.saveSequence()])

  this.buffer = null

  callback()
}

const importStream = (pool, { byteOffset, eventId } = {}) =>
  new EventStream(pool, byteOffset, eventId)

export default importStream
