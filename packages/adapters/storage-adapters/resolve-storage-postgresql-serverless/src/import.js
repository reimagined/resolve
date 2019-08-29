import stream from 'stream'
import { EOL } from 'os'
import { FREEZE_MODE_AUTO, FREEZE_MODE_MANUAL } from 'resolve-storage-base'

import {
  RESERVED_EVENT_SIZE,
  BUFFER_SIZE,
  LONG_STRING_SQL_TYPE,
  PARTIAL_EVENT_FLAG
} from './constants'

function EventStream(pool, freezeMode, byteOffset = 0, eventId = 1) {
  stream.Writable.call(this, { objectMode: true })

  this.pool = pool
  this.byteOffset = byteOffset
  this.eventId = eventId
  this.buffer = Buffer.allocUnsafe(BUFFER_SIZE)
  this.beginPosition = 0
  this.endPosition = 0
  this.vacantSize = BUFFER_SIZE
  this.saveEventPromiseSet = new Set()
  this.saveEventErrors = []
  this.timestamp = 0
  this.freezeMode = freezeMode
  this.isFrozen = false
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
  const { freeze, waitConnectAndInit } = this.pool

  await waitConnectAndInit()

  if (this.freezeMode === FREEZE_MODE_AUTO && this.isFrozen === false) {
    await freeze()
    this.isFrozen = true
  }

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
    let eventByteLength = 0

    if (this.beginPosition < endEventPosition) {
      stringifiedEvent = this.buffer
        .slice(this.beginPosition, endEventPosition)
        .toString(this.encoding)

      eventByteLength += endEventPosition - this.beginPosition
    } else {
      stringifiedEvent = this.buffer
        .slice(this.beginPosition, BUFFER_SIZE)
        .toString(this.encoding)
      stringifiedEvent += this.buffer
        .slice(0, endEventPosition)
        .toString(this.encoding)

      eventByteLength += BUFFER_SIZE - this.beginPosition + endEventPosition
    }

    this.vacantSize += eventByteLength
    this.beginPosition = endEventPosition
    this.byteOffset += eventByteLength

    const event = JSON.parse(stringifiedEvent)
    event.eventId = this.eventId++
    this.timestamp = Math.max(this.timestamp, event.timestamp)

    const saveEventPromise = this.saveEvent(event).catch(
      this.saveEventErrors.push.bind(this.saveEventErrors)
    )
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
  const { unfreeze, waitConnectAndInit } = this.pool

  await waitConnectAndInit()

  if (this.vacantSize !== BUFFER_SIZE) {
    let stringifiedEvent = null
    let eventByteLength = 0

    if (this.beginPosition < this.endPosition) {
      stringifiedEvent = this.buffer
        .slice(this.beginPosition, this.endPosition)
        .toString(this.encoding)

      eventByteLength += this.endPosition - this.beginPosition
    } else {
      stringifiedEvent = this.buffer
        .slice(this.beginPosition, BUFFER_SIZE)
        .toString(this.encoding)
      stringifiedEvent += this.buffer
        .slice(0, this.endPosition)
        .toString(this.encoding)

      eventByteLength += BUFFER_SIZE - this.beginPosition + this.endPosition
    }

    let event = PARTIAL_EVENT_FLAG
    try {
      event = JSON.parse(stringifiedEvent)
    } catch {}

    if (event !== PARTIAL_EVENT_FLAG) {
      event.eventId = this.eventId++
      this.timestamp = Math.max(this.timestamp, event.timestamp)

      this.byteOffset += eventByteLength

      const saveEventPromise = this.saveEvent(event).catch(
        this.saveEventErrors.push.bind(this.saveEventErrors)
      )
      void saveEventPromise.then(
        this.saveEventPromiseSet.delete.bind(
          this.saveEventPromiseSet,
          saveEventPromise
        )
      )
      this.saveEventPromiseSet.add(saveEventPromise)
    }
  }

  await Promise.all([
    ...this.saveEventPromiseSet,
    this.saveSequence().catch(
      this.saveEventErrors.push.bind(this.saveEventErrors)
    )
  ])

  if (this.freezeMode === FREEZE_MODE_AUTO && this.isFrozen === true) {
    await unfreeze()
    this.isFrozen = false
  }

  const error =
    this.saveEventErrors.length > 0 ? this.saveEventErrors.join(EOL) : null

  this.buffer = null

  callback(error)
}

const importStream = (
  pool,
  { byteOffset, eventId, freezeMode = FREEZE_MODE_AUTO } = {}
) => {
  switch (freezeMode) {
    case FREEZE_MODE_AUTO:
    case FREEZE_MODE_MANUAL:
      return new EventStream(pool, freezeMode, byteOffset, eventId)
    default:
      throw new Error(`Wrong freeze mode ${freezeMode}`)
  }
}

export default importStream
